import React, { Component } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { Text } from "../text";
import Scrollbar from "../scrollbar";

const TabsContainer = styled.div`
  .scrollbar {
    width: 100% !important;
    height: 50px !important;
  }
`;
const NavItem = styled.div`
  position: relative;
  white-space: nowrap;
  display: flex;
`;

const Label = styled.div`
  height: 32px;
  border-radius: 16px;
  min-width: fit-content;
  margin-right: 8px;
  width: fit-content;

  .title_style {
    text-align: center;
    margin: 7px 15px 7px 15px;
    overflow: hidden;

    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  ${props => (props.isDisabled ? `pointer-events: none;` : ``)}

  ${props =>
    props.selected
      ? `cursor: default
         background-color: #265A8F
         .title_style {
           color: #fff
          }`
      : `
    &:hover{
      cursor: pointer;
      background-color: #F8F9F9;
    }`}

  ${props =>
    props.isDisabled && props.selected
      ? `background-color: #ECEEF1
       .title_style {color: #D0D5DA}`
      : ``}
`;

const BodyContainer = styled.div`
  margin: 24px 16px 0px 16px;
`;

class TabContainer extends Component {
  constructor(props) {
    super(props);

    this.arrayRefs = [];
    const countElements = props.children.length;

    let item = countElements;
    while (item !== 0) {
      this.arrayRefs.push(React.createRef());
      item--;
    }

    this.state = {
      activeTab: this.props.selectedItem
    };

    this.scrollRef = React.createRef();
  }

  titleClick = (index, item, ref) => {
    if (this.state.activeTab !== index) {
      this.setState({ activeTab: index });
      let newItem = Object.assign({}, item);
      delete newItem.content;
      this.props.onSelect && this.props.onSelect(newItem);

      this.setTabPosition(index, ref);
    }
  };

  getWidthElements = () => {
    const arrayWidths = [];
    const length = this.arrayRefs.length - 1;
    let widthItem = 0;
    while (length + 1 !== widthItem) {
      arrayWidths.push(this.arrayRefs[widthItem].current.offsetWidth);
      widthItem++;
    }

    return arrayWidths;
  };

  shouldComponentUpdate(nextProps, nextState) {
    const { activeTab } = this.state;
    const { isDisabled } = this.props;
    if (
      activeTab === nextState.activeTab &&
      isDisabled === nextProps.isDisabled
    ) {
      return false;
    }
    return true;
  }

  componentDidMount() {
    const { activeTab } = this.state;
    if (activeTab !== 0 && this.arrayRefs[activeTab].current !== null) {
      this.secondFunction(activeTab);
    }
    console.log("this.scrollRef", this.scrollRef);
    console.log(
      "componentDidMount scroll",
      this.scrollRef.current.getClientWidth()
    ); //get main container width)
  }

  setTabPosition = (index, currentRef) => {
    const arrayOfWidths = this.getWidthElements(); //get tabs widths
    const scrollLeft = this.scrollRef.current.getScrollLeft(); // get scroll position relative to left side
    const staticScroll = this.scrollRef.current.getScrollWidth(); //get static scroll width
    const containerWidth = this.scrollRef.current.getClientWidth(); //get main container width
    //console.log("containerWidth", containerWidth);
    const currentTabWidth = currentRef.current.offsetWidth;
    const marginRight = 8;

    //get tabs of left side
    let leftTabs = 0;
    let leftFullWidth = 0;
    while (leftTabs !== index) {
      leftTabs++;
      leftFullWidth += arrayOfWidths[leftTabs] + marginRight;
    }
    leftFullWidth += arrayOfWidths[0] + marginRight;

    //get tabs of right side
    let rightTabs = this.arrayRefs.length - 1;
    let rightFullWidth = 0;
    while (rightTabs !== index - 1) {
      rightFullWidth += arrayOfWidths[rightTabs] + marginRight;
      rightTabs--;
    }

    //Out of range of left side
    if (leftFullWidth > containerWidth + scrollLeft) {
      let prevIndex = index - 1;
      let widthBlocksInContainer = 0;
      while (prevIndex !== -1) {
        widthBlocksInContainer += arrayOfWidths[prevIndex] + marginRight;
        prevIndex--;
      }

      const difference = containerWidth - widthBlocksInContainer;
      const currentContainerWidth = currentTabWidth;

      this.scrollRef.current.scrollLeft(
        difference * -1 + currentContainerWidth + marginRight
      );
    }
    //Out of range of left side
    else if (rightFullWidth > staticScroll - scrollLeft) {
      this.scrollRef.current.scrollLeft(staticScroll - rightFullWidth);
    }
  };

  /*firstFunction = () => {
    let prevIndex = index - 1;
    let widthBlocksInContainer = 0;
    while (prevIndex !== -1) {
      widthBlocksInContainer += arrayOfWidths[prevIndex] + marginRight;
      prevIndex--;
    }

    const difference = containerWidth - widthBlocksInContainer;
    const currentContainerWidth = currentTabWidth;

    this.scrollRef.current.scrollLeft(
      difference * -1 + currentContainerWidth + marginRight
    );
  }*/

  secondFunction = index => {
    const arrayOfWidths = this.getWidthElements(); //get tabs widths
    const marginRight = 8;
    let rightTabs = this.arrayRefs.length - 1;
    let rightFullWidth = 0;
    while (rightTabs !== index - 1) {
      rightFullWidth += arrayOfWidths[rightTabs] + marginRight;
      rightTabs--;
    }

    const staticScroll = this.scrollRef.current.getScrollWidth(); //get static scroll width
    this.scrollRef.current.scrollLeft(staticScroll - rightFullWidth);
  };

  render() {
    //console.log("Tabs container render");

    const { isDisabled, children } = this.props;
    const { activeTab } = this.state;

    return (
      <TabsContainer>
        <Scrollbar
          //values={this.onScrollFrame}
          //autoHide
          //autoHideTimeout={1000}
          stype="mediumBlack"
          className="scrollbar"
          ref={this.scrollRef}
        >
          <NavItem className="className_items">
            {children.map((item, index) => (
              <Label
                ref={this.arrayRefs[index]}
                onClick={this.titleClick.bind(
                  this,
                  index,
                  item,
                  this.arrayRefs[index]
                )}
                key={item.key}
                selected={activeTab === index}
                isDisabled={isDisabled}
              >
                <Text.Body className="title_style" fontSize={13}>
                  {item.title}
                </Text.Body>
              </Label>
            ))}
          </NavItem>
        </Scrollbar>
        <BodyContainer>{children[activeTab].content}</BodyContainer>
      </TabsContainer>
    );
  }
}

TabContainer.propTypes = {
  children: PropTypes.PropTypes.arrayOf(PropTypes.object.isRequired).isRequired,
  isDisabled: PropTypes.bool,
  onSelect: PropTypes.func,
  selectedItem: PropTypes.number
};

TabContainer.defaultProps = {
  selectedItem: 0
};

export default TabContainer;
