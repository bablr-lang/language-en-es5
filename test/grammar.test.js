import { dedent } from '@qnighy/dedent';
// eslint-disable-next-line import/no-unresolved
import language from '@bablr/language-en-es5';
import { buildTag } from 'bablr';
import { expect } from 'expect';
import { printCSTML } from '@bablr/helpers/tree';
import { m } from '@bablr/helpers/grammar';

let enhancers = undefined;

const buildJSTag = (type) => {
  const matcher = m`<${type} />`;
  return buildTag(language, matcher, undefined, { enhancers });
};

const print = (tree) => {
  return printCSTML(tree);
};

describe('@bablr/language-en-es5', () => {
  describe('Object', () => {
    const js = buildJSTag('Object');

    it('js`{o:null,}`', () => {
      expect(print(js`{o:null,}`)).toEqual(dedent`
        <_>
          _:
          <Object>
            openToken*: <* '{' />
            elements[]:
            <ObjectElement>
              value+:
              <Property>
                key$: <*Identifier 'o' />
                mapOperator*: <* ':' />
                value+$:
                <Null>
                  sigilToken*: <*Keyword 'null' />
                </>
              </>
              separatorToken*: <* ',' />
            </>
            closeToken*: <* '}' />
          </>
        </>
      `);
    });

    it('js`{o(){}}`', () => {
      expect(print(js`{o(){}}`)).toEqual(dedent`
        <_>
          _:
          <Object>
            openToken*: <* '{' />
            elements[]:
            <ObjectElement>
              value+:
              <Method>
                name$: <*Identifier 'o' />
                openParamsToken*: <* '(' />
                closeParamsToken*: <* ')' />
                body*:
                <Block>
                  openToken*: <* '{' />
                  closeToken*: <* '}' />
                </>
              </>
            </>
            closeToken*: <* '}' />
          </>
        </>
      `);
    });
  });
});
