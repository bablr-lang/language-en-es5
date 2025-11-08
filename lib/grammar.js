import { spam as m } from '@bablr/boot';
import { buildPattern } from '@bablr/helpers/builders';
import { eat, eatMatch, shiftMatch, fail, o, r } from '@bablr/helpers/grammar';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import { List } from '@bablr/helpers/productions';
import Space from '@bablr/language-en-blank-space';
import Comment from '@bablr/language-en-c-comments';
import { default as es3, unaryPrefixOperatorAlternatives } from '@bablr/language-en-es3';
import Regex from './regex.js';
import { printSource } from '@bablr/agast-helpers/tree';

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
    yield eat(m`openParamsToken*: <*Punctuator '(' { balanced: ')' } />`);
    yield* List({
      element: m`params[]*: <Identifier />`,
      allowTrailingSeparator: false,
      separator: m`#separatorTokens[]: <*Punctuator ',' />`,
    });
    yield eat(m`closeParamsToken*: <*Punctuator ')' { balancer: true } />`);
    yield eat(m`body*: <BlockStatement />`);
  }

  *Object() {
    yield eat(m`openToken*: <*Punctuator '{' { balanced: '}' } />`);
    yield* List({
      element: m`properties[]$: <Property />`,
      separator: m`#separatorTokens[]: <*Punctuator ',' />`,
      allowTrailingSeparator: true,
    });
    yield eat(m`closeToken*: <*Punctuator '}' { balancer: true } />`);
  }

  *Property() {
    let index, key;
    if (yield eatMatch(m`key$: <String /['"]/ />`)) {
      yield eat(m`mapOperator*: <*Punctuator ':' />`);
      yield eat(m`value+$: <_Expression />`, o({ power: 32 }));
    } else if (
      (index = yield eatMatch(m`key$: <UnsignedInteger /\d/ />`)) ||
      (key = yield eatMatch(m`key$: <Identifier />`, o({ scoped: false })))
    ) {
      let cn =
        index || reservedWords_.has(printSource(key))
          ? yield eat(m`mapOperator*: <*Punctuator ':' />`, null, o({ bind: true }))
          : yield eatMatch(m`mapOperator*: <*Punctuator ':' />`, null, o({ bind: true }));
      if (cn) {
        yield eat(m`value+$: <_Expression />`, o({ power: 32 }));
      } else {
        yield eat(m`value+$: <FunctionExpression />`, o({ shorthand: true }));
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
