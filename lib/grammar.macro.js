import { re, spam as m } from '@bablr/boot';
import { CoveredBy, Node } from '@bablr/helpers/decorators';
import { eat, eatMatch, holdForMatch, o } from '@bablr/helpers/grammar';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as Comment from '@bablr/language-en-c-comments';
import * as es3 from '@bablr/language-en-es3';

export const dependencies = { Comment };

export const canonicalURL = 'https://bablr.org/languages/universe/es5';

export const atrivialGrammar = class ES5Grammar extends es3.atrivialGrammar {
  *Expression({ props: { power = 34 }, s }) {
    let res;
    if (!s.holding) {
      if ((res = yield eatMatch(m`<_JSONExpression />`))) {
      } else if (
        power >= 4 &&
        (res = yield eatMatch(m`<UnaryExpression /typeof|\+\+|--|\+|-|void|delete|!/ />`))
      ) {
      } else if (power >= 4 && (res = yield eatMatch(m`<NewExpression 'new' />`, o({ power })))) {
      } else if ((res = yield eatMatch(m`<FunctionExpression 'function' />`))) {
      } else if ((res = yield eatMatch(m`<Identifier />`))) {
      }
    } else {
      res = yield eatMatch(m`<_LogicExpression />`, o({ power }));
    }
    if (res) {
      return holdForMatch(m`<__Expression />`, o({ power }));
    }
  }

  @CoveredBy('Expression')
  @Node
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
      m`params[]: <_List />`,
      o({
        element: m`<Identifier />`,
        allowTrailingSeparator: false,
        separator: m`separatorTokens[]: <*Punctuator ',' />`,
      }),
    );
    yield eat(m`closeParamsToken: <*Punctuator ')' { balancer: true } />`);
    yield eat(m`body: <BlockStatement />`);
  }

  @CoveredBy('JSONExpression')
  @CoveredBy('Expression')
  @Node
  *Object() {
    yield eat(m`open: <*Punctuator '{' { balanced: '}' } />`);
    yield eat(
      m`properties[]$: <_List />`,
      o({
        element: m`<Property />`,
        separator: m`separatorTokens[]: <*Punctuator ',' />`,
        allowTrailingSeparator: true,
      }),
    );
    yield eat(m`close: <*Punctuator '}' { balancer: true } />`);
  }

  @Node
  *Property() {
    yield eat(m`key$: <Identifier />`);
    let cn = yield eatMatch(m`mapOperator: <*Punctuator ':' />`, null, o({ bind: true }));
    if (cn) {
      yield eat(m`value+$: <__Expression />`, o({ power: 16 }));
    } else {
      yield eat(m`value+$: <FunctionExpression />`, o({ shorthand: true }));
    }
  }
};

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span === 'Bare',
    triviaMatcher: m`#: :Comment: <_Trivia /[ \n\r\t]|\/\/|\/\*/ />`,
  },
  atrivialGrammar,
);
