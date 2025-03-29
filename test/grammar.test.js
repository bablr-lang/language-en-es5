import { spam } from '@bablr/boot';
import { dedent } from '@qnighy/dedent';
// eslint-disable-next-line import/no-unresolved
import * as language from '@bablr/language-en-es5';
import { buildTag, Context } from 'bablr';
import { debugEnhancers } from '@bablr/helpers/enhancers';
import { expect } from 'expect';
import { printPrettyCSTML } from '@bablr/helpers/tree';
import { buildIdentifier, buildString } from '@bablr/helpers/builders';

let enhancers = undefined;

const ctx = Context.from(language, enhancers?.bablrProduction);

const buildJSTag = (type) => {
  const matcher = spam`<$${buildString(language.canonicalURL)}:${buildIdentifier(type)} />`;
  return buildTag(ctx, matcher, undefined, { enhancers });
};

const print = (tree) => {
  return printPrettyCSTML(tree, { ctx });
};

describe('@bablr/language-en-es5', () => {
  describe('Object', () => {
    const js = buildJSTag('Object');

    it('js`{o:null,}`', () => {
      expect(print(js`{o:null,}`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/universe/es5' }>
        <$>
          .:
          <$Object>
            open: <*Punctuator '{' { balanced: '}' } />
            separatorTokens[]: []
            properties[]$: []
            properties[]$:
            <$Property>
              key$:
              <$Identifier>
                value: <*Literal 'o' />
              </>
              mapOperator: <*Punctuator ':' />
              value+$:
              <$Null>
                sigilToken: <*Keyword 'null' />
              </>
            </>
            separatorTokens[]: <*Punctuator ',' />
            close: <*Punctuator '}' { balancer: true } />
          </>
        </>\n`);
    });

    it('js`{o(){}}`', () => {
      expect(print(js`{o(){}}`)).toEqual(dedent`\
      <!0:cstml { bablrLanguage: 'https://bablr.org/languages/universe/es5' }>
      <$>
        .:
        <$Object>
          open: <*Punctuator '{' { balanced: '}' } />
          separatorTokens[]: []
          properties[]$: []
          properties[]$:
          <$Property>
            key$:
            <$Identifier>
              value: <*Literal 'o' />
            </>
            mapOperator: null
            value+$:
            <$FunctionExpression>
              sigilToken: null
              id: null
              openParamsToken: <*Punctuator '(' { balanced: ')' } />
              separatorTokens[]: []
              params[]: []
              closeParamsToken: <*Punctuator ')' { balancer: true } />
              body:
              <$BlockStatement>
                openToken: <*Punctuator '{' { balanced: '}' } />
                closeToken: <*Punctuator '}' { balancer: true } />
                endToken: null
              </>
            </>
          </>
          close: <*Punctuator '}' { balancer: true } />
        </>
      </>\n`);
    });
  });
});
