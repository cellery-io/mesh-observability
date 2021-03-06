/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* eslint react/prefer-stateless-function: ["off"] */

import ColorGenerator from "./colorGenerator";
import React from "react";
import * as PropTypes from "prop-types";

// Creating a context that can be accessed
const ColorContext = React.createContext(null);

/**
 * Color Provider to provide the color generator.
 *
 * @param {Object} props Props passed into the color provider
 * @constructor
 */
class ColorProvider extends React.Component {

    constructor(props) {
        super(props);

        const colorGenerator = new ColorGenerator();
        this.state = {
            colorGenerator: colorGenerator
        };
        colorGenerator.addListener(this.handleColorChange);
    }

    handleColorChange = () => {
        this.state.colorGenerator.removeListener(this.handleColorChange);

        // Adding the new color generator
        const colorGenerator = new ColorGenerator();
        this.setState({
            colorGenerator: colorGenerator
        });
        colorGenerator.addListener(this.handleColorChange);
    };

    componentWillUnmount() {
        this.state.colorGenerator.removeListener(this.handleColorChange);
    }

    render = () => {
        const {children} = this.props;
        const {colorGenerator} = this.state;

        return (
            <ColorContext.Provider value={colorGenerator}>
                {children}
            </ColorContext.Provider>
        );
    };

}

ColorProvider.propTypes = {
    children: PropTypes.any.isRequired
};

/**
 * Higher Order Component for accessing the Color Generator.
 *
 * @param {React.ComponentType} Component component which needs access to the color generator.
 * @returns {React.ComponentType} The new HOC with access to the color generator.
 */
const withColor = (Component) => {
    class ColorGeneratorProvider extends React.Component {

        render() {
            const {forwardedRef, ...otherProps} = this.props;

            return (
                <ColorContext.Consumer>
                    {(colorGenerator) => (
                        <Component colorGenerator={colorGenerator} ref={forwardedRef} {...otherProps}/>
                    )}
                </ColorContext.Consumer>
            );
        }

    }

    return React.forwardRef((props, ref) => <ColorGeneratorProvider {...props} forwardedRef={ref} />);
};

export default withColor;
export {ColorProvider, ColorGenerator};
