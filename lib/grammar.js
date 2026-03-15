import { spam as m, re } from '@bablr/boot';
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
  startSpan,
  endSpan,
  match,
} from '@bablr/helpers/grammar';
import * as Spans from '@bablr/agast-helpers/spans';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import Space from '@bablr/language-en-blank-space';
import Comment from '@bablr/language-en-c-comments';
import { default as es3, unaryPrefixOperatorAlternatives } from '@bablr/language-en-es3';
import Regex from './regex.js';
import { getRoot, printSource } from '@bablr/agast-helpers/tree';
import { Coroutine } from '@bablr/coroutine';
import { reifyMatcherReferenceName } from '@bablr/agast-vm-helpers';

export {
  assignmentOperators,
  assignmentOperatorAlternatives,
  unaryPrefixOperators,
  unaryPrefixOperatorAlternatives,
  unaryPostfixOperators,
  unaryPostfixOperatorAlternatives,
  getBinaryOperatorAlternatives,
} from '@bablr/language-en-es3';

export const dependencies = { Space, Comment, Regex };

export const canonicalURL = 'https://bablr.org/languages/universe/en/es5';

export const defaultMatcher = m`_+: <_Expression />`;

export const fragmentProduction = 'Fragment';

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
  *Expression({ props: { power }, getState }) {
    let { powers } = this.constructor;
    let s = getState();
    let res;
    let power_ = power || powers.comma;
    if (!s.shifted) {
      if ((res = yield eatMatch(m`<ParenthesisExpression '(' />`))) {
      } else if ((res = yield eatMatch(m`<_JSONExpression />`))) {
      } else if (
        power_ >= powers.unary_prefix &&
        (res = yield eatMatch(
          m`<UnaryExpression ${buildPattern(unaryPrefixOperatorAlternatives)} />`,
        ))
      ) {
      } else if (
        power_ >= powers.new &&
        (res = yield eatMatch(m`<NewExpression 'new' />`, o({ power: power_ })))
      ) {
      } else if ((res = yield eatMatch(m`:Regex: <Pattern '/' />`, o({}), o({ held: 'eat' })))) {
      } else if ((res = yield eatMatch(m`<ThisExpression 'this' />`))) {
      } else if ((res = yield eatMatch(m`<FunctionExpression 'function' />`))) {
      } else {
        res = yield eat(m`<Identifier />`);
      }
    } else {
      res = yield eat(m`<_LogicExpression />`, o({ power: power_ }));
    }
    if (res && !(yield match(re`/$/`))) {
      return r(shiftMatch(m`<_Expression />`, o({ power: power_ })));
    }
  }

  *FunctionExpression({ props: { shorthand } }) {
    if (!shorthand) {
      yield eat(m`sigilToken*: <*Keyword 'function' />`);
      yield eatMatch(m`name$: <Identifier />`);
    }
    yield eat(m`openParamsToken*: <* '(' />`);
    yield startSpan('Bare', ')');
    let sep = true;
    while (sep && !(yield match(re`/$/`))) {
      yield eat(m`params[]+$: <Identifier />`);
      sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
    }
    if (sep && sep !== true) yield fail();
    yield endSpan();
    yield eat(m`closeParamsToken*: <* ')' />`);
    yield eat(m`body*: <Block />`);
  }

  *Object() {
    yield eat(m`openToken*: <* '{' />`);
    yield startSpan('Bare', '}');
    let sep = true;
    while (sep && !(yield match(re`/$/`))) {
      yield eat(m`properties[]+$: <_ObjectElement />`);
      sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
    }
    yield endSpan();
    yield eat(m`closeToken*: <* '}' />`);
  }

  *ObjectElement({ s }) {
    if (s().shifted) {
      if (yield eatMatch(m`<Property ':' />`)) {
      } else {
        yield eatMatch(m`<Method '(' />`);
      }
    } else {
      yield eat(m`<_ObjectKey />`);

      return r(shift(m`<_ObjectElement />`));
    }
  }

  *Property({ s }) {
    let { shifted } = s();
    yield eat(m`key$: <_ObjectKey />`, o({}), o({ held: 'eat' }));
    let firstToken = printSource(
      BTree.getAt(1, getRoot(shifted).value.bounds.leading).property.value.node,
    );
    let isIndex = /\d/.test(firstToken[0]);

    let cn =
      isIndex || reservedWords_.has(printSource(shifted))
        ? yield eat(m`mapOperator*: <* ':' />`)
        : yield eatMatch(m`mapOperator*: <* ':' />`);
    if (cn) {
      yield eat(m`value+$: <_Element />`);
    }
  }

  *Method({ s }) {
    let co = runCo(execAtrivial(s, m`<__FunctionExpression />`));

    while (!co.done) {
      let instr = co.value;
      let refName = reifyMatcherReferenceName(getInstrMatcher(instr));

      if (refName === 'name') {
        co.advance(yield eat(m`name$: <_ObjectKey />`, o({}), o({ held: 'eat' })));
      } else if (refName !== 'sigilToken') {
        co.advance(yield instr);
      } else {
        co.advance(null);
      }
    }
  }

  *Identifier({ props: { scoped = true } }) {
    let id = printSource(
      getRoot((yield eat(m`value*: <*Literal /[a-zA-Z_$][a-zA-Z\d_$]*/ />`)).node),
    );
    if (scoped && reservedWords_.has(id)) yield fail();
  }
};

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span.name === 'Bare',

    *Trivia({ s }) {
      let span = Spans.getSpan('Trivia', s().spans);

      let spaces = span?.props.spaces ?? Infinity;

      yield startSpan('Trivia', null, span?.props);
      let res = yield match(re`/\/\/|\/\*|[ \t][^ \t\r\n\g]|[ \n\r\t]/`);

      if (res) {
        res = printSource(res);
      }

      if (res && ' \t'.includes(res[0]) && res.length === 2 && spaces > 1) {
        yield eat(m`#: <* ' ' />`, o({}), o({ hold: true }));
      } else {
        yield eat(m`#: <Trivia />`, o({}), o({ hold: true }));
      }
      yield endSpan();
    },
  },
  atrivial,
);

export default { canonicalURL, dependencies, grammar, defaultMatcher, fragmentProduction };
