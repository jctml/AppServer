import React from "react";
import { withRouter } from "react-router";
import { Text, utils } from 'asc-web-components';
import styled from 'styled-components';
import { withTranslation } from 'react-i18next';
import { getKeyByLink, settingsTree } from '../../../utils';

const Header = styled(Text.ContentHeader)`
  margin-right: 16px;
  max-width: calc(100vw - 430px);
  @media ${utils.device.tablet} {
    max-width: calc(100vw - 96px);
  }
`;

const getSelectedTitleByKey = key => {
  const length = key.length;
  if (length === 1) {
    return settingsTree[key].link;
  }
  else if (length === 3) {
    return settingsTree[key[0]].children[key[2]].link;
  }
};

class SectionHeaderContent extends React.Component {

  constructor(props) {
    super(props);

    const { match, location } = props;
    const fullSettingsUrl = match.url;
    const locationPathname = location.pathname;

    const fullSettingsUrlLength = fullSettingsUrl.length;

    const resultPath = locationPathname.slice(fullSettingsUrlLength + 1);
    const arrayOfParams = resultPath.split('/');

    const key = getKeyByLink(settingsTree, arrayOfParams);
    const header = getSelectedTitleByKey(key);
    this.state = {
      header
    }


  }

  componentDidUpdate() {
    const { match, location } = this.props;
    const fullSettingsUrl = match.url;
    const locationPathname = location.pathname;


    const fullSettingsUrlLength = fullSettingsUrl.length;

    const resultPath = locationPathname.slice(fullSettingsUrlLength + 1);
    const arrayOfParams = resultPath.split('/');

    const key = getKeyByLink(settingsTree, arrayOfParams);
    const header = getSelectedTitleByKey(key);
    header !== this.state.header && this.setState({ header });
  }

  render() {
    const { t } = this.props;
    const { header } = this.state;

    return (
      <Header truncate={true}>
        {t(`Settings_${header}`)}
      </Header>
    );
  }
};

export default withRouter(withTranslation()(SectionHeaderContent));
