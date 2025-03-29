import { re, spam as m } from '@bablr/boot';
import { CoveredBy, Node } from '@bablr/helpers/decorators';
import { eat, eatMatch, o } from '@bablr/helpers/grammar';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as Comment from '@bablr/language-en-c-comments';
import * as es3 from '@bablr/language-en-es3';

export const dependencies = { Comment };

export const canonicalURL = 'https://bablr.org/languages/universe/es5';

export const atrivialGrammar = class ES5Grammar extends es3.atrivialGrammar {
  @CoveredBy('Expression')
  @Node
  *FunctionExpression({ value: options }) {
    const { shorthand } = options.value;
    if (!shorthand) {
      yield eat(m`sigilToken: <*Keyword 'function' />`);
      yield eatMatch(m`id: <Identifier />`);
    } else {
      yield eat(m`sigilToken: null`);
      yield eat(m`id: null`);
    }
    yield eat(m`openParamsToken: <*Punctuator '(' { balanced: ')' } />`);
    yield eat(
      m`params[]: <List />`,
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
      m`properties[]$: <List />`,
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
      yield eat(m`value+$: <Expression />`, o({ power: 16 }));
    } else {
      yield eat(m`value+$: <FunctionExpression />`, o({ shorthand: true }));
    }
  }
};

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span === 'Bare',
    triviaMatcher: m`#: <Comment:Trivia /[ \n\r\t]|\/\/|\/\*/ />`,
  },
  atrivialGrammar,
);
