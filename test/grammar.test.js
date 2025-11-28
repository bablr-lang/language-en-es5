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
          openToken*: <* '{' />
          properties[]+:
          <$Identifier>
            value*: <*Literal 'o' />
          </>
          ^^^
          <$Property>
            key: <//>
            mapOperator*: <* ':' />
            value+:
            <$Null>
              sigilToken*: <*Keyword 'null' />
            </>
          </>
          #separatorTokens: <* ',' />
          closeToken*: <* '}' />
        </>\n`);
    });

    it('js`{o(){}}`', () => {
      expect(print(js`{o(){}}`)).toEqual(dedent`\
        <$Object>
          openToken*: <* '{' />
          properties[]+:
          <$Identifier>
            value*: <*Literal 'o' />
          </>
          ^^^
          <$Method>
            id: <//>
            openParamsToken*: <* '(' />
            closeParamsToken*: <* ')' />
            body*:
            <$Block>
              openToken*: <* '{' />
              closeToken*: <* '}' />
            </>
          </>
          closeToken*: <* '}' />
        </>\n`);
    });
  });
});
