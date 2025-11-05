import { spam } from '@bablr/boot';
import { dedent } from '@qnighy/dedent';
// eslint-disable-next-line import/no-unresolved
import language from '@bablr/language-en-es5';
import { buildTag } from 'bablr';
import { debugEnhancers } from '@bablr/helpers/enhancers';
import { expect } from 'expect';
import { printPrettyCSTML } from '@bablr/helpers/tree';
import { buildIdentifier } from '@bablr/helpers/builders';

let enhancers = undefined;

const buildJSTag = (type) => {
  const matcher = spam`<$${buildIdentifier(type)} />`;
  return buildTag(language, matcher, undefined, { enhancers });
};

const print = (tree) => {
  return printPrettyCSTML(tree);
};

describe('@bablr/language-en-es5', () => {
  describe('Object', () => {
    const js = buildJSTag('Object');

    it('js`{o:null,}`', () => {
      expect(print(js`{o:null,}`)).toEqual(dedent`\
        <$Object>
          openToken*: <*Punctuator '{' { balanced: '}' } />
          properties[]:
          <$Property>
            key:
            <$Identifier>
              value*: <*Literal 'o' />
            </>
            mapOperator*: <*Punctuator ':' />
            value+:
            <$Null>
              sigilToken*: <*Keyword 'null' />
            </>
          </>
          #separatorTokens[]: <*Punctuator ',' />
          closeToken*: <*Punctuator '}' { balancer: true } />
        </>\n`);
    });

    it('js`{o(){}}`', () => {
      expect(print(js`{o(){}}`)).toEqual(dedent`\
        <$Object>
          openToken*: <*Punctuator '{' { balanced: '}' } />
          properties[]:
          <$Property>
            key:
            <$Identifier>
              value*: <*Literal 'o' />
            </>
            mapOperator*: null
            value+:
            <$FunctionExpression>
              sigilToken*: null
              id*: null
              openParamsToken*: <*Punctuator '(' { balanced: ')' } />
              closeParamsToken*: <*Punctuator ')' { balancer: true } />
              body*:
              <$BlockStatement>
                openToken*: <*Punctuator '{' { balanced: '}' } />
                closeToken*: <*Punctuator '}' { balancer: true } />
              </>
            </>
          </>
          closeToken*: <*Punctuator '}' { balancer: true } />
        </>\n`);
    });
  });
});
