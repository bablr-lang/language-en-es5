import { spam as m } from '@bablr/boot';
import { buildPattern } from '@bablr/helpers/builders';
import * as BTree from '@bablr/agast-helpers/btree';
import {
  eat,
  eatMatch,
  shift,
  shiftMatch,
  fail,
  o,
  r,
  exec,
  getInstrMatcher,
} from '@bablr/helpers/grammar';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import { List } from '@bablr/helpers/productions';
import Space from '@bablr/language-en-blank-space';
import Comment from '@bablr/language-en-c-comments';
import { default as es3, unaryPrefixOperatorAlternatives } from '@bablr/language-en-es3';
import Regex from './regex.js';
import { getRoot, printSource } from '@bablr/agast-helpers/tree';
import { Coroutine } from '@bablr/coroutine';
import { reifyMatcherReferenceName } from '@bablr/agast-vm-helpers';

export {
  powerLevels,
  assignmentOperators,
  assignmentOperatorAlternatives,
  unaryPrefixOperators,
  unaryPrefixOperatorAlternatives,
  unaryPostfixOperators,
  unaryPostfixOperatorAlternatives,
  getBinaryOperatorAlternatives,
} from '@bablr/language-en-es3';

export const dependencies = { Space, Comment, Regex };

export const canonicalURL = 'https://bablr.org/languages/universe/es5';

export const defaultMatcher = m`.+$: <_Expression />`;

let runCo = (generator) => new Coroutine(generator).advance();

let execAtrivial = (s, m, value = o({})) => exec(s, m, value, (g) => g.atrivial);

export const reservedWords = Object.freeze([
  'arguments',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'super',
  'static',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

let reservedWords_ = new Set(reservedWords);

const atrivial = class ES5Grammar extends es3.grammar.atrivial {
  *Expression({ props: { power = 34 }, getState }) {
    let s = getState();
    let res;
    if (!s.holding) {
      if ((res = yield eatMatch(m`<ParenthesisExpression '(' />`))) {
      } else if ((res = yield eatMatch(m`<_JSONExpression />`))) {
      } else if (
        power >= 4 &&
        (res = yield eatMatch(
          m`<UnaryExpression ${buildPattern(unaryPrefixOperatorAlternatives)} />`,
        ))
      ) {
      } else if (power >= 4 && (res = yield eatMatch(m`<NewExpression 'new' />`, o({ power })))) {
      } else if ((res = yield eatMatch(m`:Regex: <Pattern '/' />`))) {
      } else if ((res = yield eatMatch(m`<ThisExpression 'this' />`))) {
      } else if ((res = yield eatMatch(m`<FunctionExpression 'function' />`))) {
      } else {
        res = yield eat(m`<Identifier />`);
      }
    } else {
      res = yield eat(m`<_LogicExpression />`, o({ power }));
    }
    if (res) {
      return r(shiftMatch(m`<_Expression />`, o({ power })));
    }
  }

  *FunctionExpression({ props: { shorthand } }) {
    if (!shorthand) {
      yield eat(m`sigilToken*: <*Keyword 'function' />`);
      yield eatMatch(m`id*: <Identifier />`);
    } else {
      yield eat(m`sigilToken*: null`);
      yield eat(m`id*: null`);
    }
    yield eat(m`openParamsToken*: <* '(' { balanced: ')' } />`);
    yield* List({
      element: m`params[]*: <Identifier />`,
      allowTrailingSeparator: false,
      separator: m`#separatorTokens[]: <* ',' />`,
    });
    yield eat(m`closeParamsToken*: <* ')' { balancer: true } />`);
    yield eat(m`body*: <Block />`);
  }

  *Object() {
    yield eat(m`openToken*: <* '{' { balanced: '}' } />`);
    yield* List({
      element: m`properties[]+$: <_ObjectElement />`,
      separator: m`#separatorTokens[]: <* ',' />`,
      allowTrailingSeparator: true,
    });
    yield eat(m`closeToken*: <* '}' { balancer: true } />`);
  }

  *ObjectElement({ s }) {
    if (s().held) {
      if (yield eatMatch(m`<Property ':' />`)) {
      } else {
        yield eatMatch(m`<Method '(' />`);
      }
    } else {
      yield eat(m`<_ObjectKey />`);

      return r(shift(m`<_ObjectElement />`));
    }
  }

  *Property() {
    let key = yield eat(m`key$: <_ObjectKey />`);
    let firstToken = printSource(BTree.getAt(-2, getRoot(key.node).bounds[0]).node);
    let isIndex = /\d/.test(firstToken[0]);

    let cn =
      isIndex || reservedWords_.has(printSource(key))
        ? yield eat(m`mapOperator*: <* ':' />`, null, o({ bind: true }))
        : yield eatMatch(m`mapOperator*: <* ':' />`, null, o({ bind: true }));
    if (cn) {
      yield eat(m`value+$: <_Expression />`, o({ power: 32 }));
    }
  }

  *Method({ s }) {
    let co = runCo(execAtrivial(s, m`<__FunctionExpression />`));

    while (!co.done) {
      let instr = co.value;
      let refName = reifyMatcherReferenceName(getInstrMatcher(instr));

      if (refName === 'id') {
        co.advance(yield eat(m`id$: <_ObjectKey />`));
      } else if (refName !== 'sigilToken') {
        co.advance(yield instr);
      } else {
        co.advance(null);
      }
    }
  }

  *Identifier({ props: { scoped = true } }) {
    let id = printSource((yield eat(m`value*: <*Literal /[a-zA-Z_$][a-zA-Z\d_$]*/ />`)).node);
    if (scoped && reservedWords_.has(id)) yield fail();
  }
};

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span === 'Bare',
    triviaMatcher: m`#: <__Trivia /[ \n\r\t]|\/\/|\/\*/ />`,
  },
  atrivial,
);

export default { canonicalURL, dependencies, grammar, defaultMatcher };
