import { spam as m, re } from '@bablr/boot';
import { buildPattern } from '@bablr/helpers/builders';
import { eat, eatMatch, match, shiftMatch, fail, o } from '@bablr/helpers/grammar';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as Space from '@bablr/language-en-blank-space';
import * as Comment from '@bablr/language-en-c-comments';
import * as es3 from '@bablr/language-en-es3';

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

export const dependencies = { Space, Comment };

export const canonicalURL = 'https://bablr.org/languages/universe/es5';

export const defaultMatcher = m`.+: <_Expression />`;

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

export const atrivialGrammar = class ES5Grammar extends es3.atrivialGrammar {
  *Expression({ props: { power = 34 }, s }) {
    let res;
    if (!s.holding) {
      if ((res = yield eatMatch(m`<ParenthesisExpression '(' />`))) {
      } else if ((res = yield eatMatch(m`<_JSONExpression />`))) {
      } else if (
        power >= 4 &&
        (res = yield eatMatch(
          m`<UnaryExpression ${buildPattern(es3.unaryPrefixOperatorAlternatives)} />`,
        ))
      ) {
      } else if (power >= 4 && (res = yield eatMatch(m`<NewExpression 'new' />`, o({ power })))) {
      } else if ((res = yield eatMatch(m`<FunctionExpression 'function' />`))) {
      } else {
        res = yield eat(m`<Identifier />`);
      }
    } else {
      res = yield eat(m`<_LogicExpression />`, o({ power }));
    }
    if (res) {
      return shiftMatch(m`<_Expression />`, o({ power }));
    }
  }

  *FunctionExpression({ props: { shorthand } }) {
    if (!shorthand) {
      yield eat(m`sigilToken: <*Keyword 'function' />`);
      yield eatMatch(m`id: <Identifier />`);
    } else {
      yield eat(m`sigilToken: null`);
      yield eat(m`id: null`);
    }
    yield eat(m`openParamsToken: <*Punctuator '(' { balanced: ')' } />`);
    yield eat(
      m`params[]: <__List />`,
      o({
        element: m`<Identifier />`,
        allowTrailingSeparator: false,
        separator: m`#separatorTokens[]: <*Punctuator ',' />`,
      }),
    );
    yield eat(m`closeParamsToken: <*Punctuator ')' { balancer: true } />`);
    yield eat(m`body: <BlockStatement />`);
  }

  *Object() {
    yield eat(m`open: <*Punctuator '{' { balanced: '}' } />`);
    yield eat(
      m`properties[]$: <__List />`,
      o({
        element: m`<Property />`,
        separator: m`#separatorTokens[]: <*Punctuator ',' />`,
        allowTrailingSeparator: true,
      }),
    );
    yield eat(m`close: <*Punctuator '}' { balancer: true } />`);
  }

  *Property() {
    if (yield match(re`/['"]/`)) {
      yield eat(m`key$: <String />`);
      yield eat(m`mapOperator: <*Punctuator ':' />`);
      yield eat(m`value+$: <_Expression />`, o({ power: 32 }));
    } else if (yield eatMatch(m`key$: <Identifier />`)) {
      let cn = yield eatMatch(m`mapOperator: <*Punctuator ':' />`, null, o({ bind: true }));
      if (cn) {
        yield eat(m`value+$: <_Expression />`, o({ power: 32 }));
      } else {
        yield eat(m`value+$: <FunctionExpression />`, o({ shorthand: true }));
      }
    }
  }

  *Identifier({ props: { scoped = true }, ctx }) {
    let id = ctx.sourceTextFor(yield eat(m`value: <*Literal /[a-zA-Z_$][a-zA-Z\d_$]*/ />`));
    if (scoped && reservedWords_.has(id)) yield fail();
  }
};

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span === 'Bare',
    triviaMatcher: m`#: <__Trivia /[ \n\r\t]|\/\/|\/\*/ />`,
  },
  atrivialGrammar,
);
