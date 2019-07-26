import React from 'react';
import PropTypes from 'prop-types';
import RadioButton from './radio-button';
import styled from 'styled-components';

const StyledDiv = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

class RadioButtonGroup extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      selectedOption: this.props.selected

    };
  }


  handleOptionChange = changeEvent => {
    this.setState({
      selectedOption: changeEvent.target.value
    });
  };


  render() {
    const options = this.props.options;
    return (
      <StyledDiv>
        {options.map(option => {
          return (
            <RadioButton
              key={option.value}
              name={this.props.name}
              value={option.value}
              checked={this.state.selectedOption === option.value}
              onChange={this.handleOptionChange}
              disabled={this.props.isDisabledGroup || option.disabled}
              label={option.label}
              spaceBtwnElems={this.props.spaceBtwnElems}
            />
              )
            }
          )
        }
      </StyledDiv>
    );
  };
};

RadioButtonGroup.propTypes = {
  isDisabledGroup: PropTypes.bool,
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
                            value: PropTypes.string.isRequired,
                            label: PropTypes.string,
                            disabled: PropTypes.bool
                          })).isRequired,
  selected: PropTypes.string.isRequired,
  spaceBtwnElems: PropTypes.number
}

RadioButtonGroup.defaultProps = {
  isDisabledGroup: false,
  selected: undefined,
  spaceBtwnElems: 33
}

export default RadioButtonGroup;
