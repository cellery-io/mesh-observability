/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import DependencyDiagram from "./DependencyDiagram";
import ErrorBoundary from "../../common/error/ErrorBoundary";
import Grey from "@material-ui/core/colors/grey";
import HttpUtils from "../../../utils/api/httpUtils";
import Logger from "js-logger";
import NotFound from "../../common/error/NotFound";
import NotificationUtils from "../../../utils/common/notificationUtils";
import Paper from "@material-ui/core/Paper/Paper";
import React from "react";
import SequenceDiagram from "./SequenceDiagram";
import Span from "../../../utils/tracing/span";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Timeline from "./timeline";
import TopToolbar from "../../common/toptoolbar";
import TracingUtils from "../../../utils/tracing/tracingUtils";
import UnknownError from "../../common/error/UnknownError";
import withStyles from "@material-ui/core/styles/withStyles";
import withGlobalState, {StateHolder} from "../../common/state";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    container: {
        flexGrow: 1,
        padding: theme.spacing.unit * 3,
        margin: theme.spacing.unit,
        display: "flow-root"
    },
    tabs: {
        marginBottom: theme.spacing.unit * 2,
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
        borderBottomColor: Grey[200]
    }
});

class View extends React.Component {

    static logger = Logger.get("components/tracing/view/index");

    constructor(props) {
        super(props);

        this.tabs = [
            "timeline",
            "sequence-diagram",
            "dependency-diagram"
        ];
        const queryParams = HttpUtils.parseQueryParams(props.location.search);
        const preSelectedTab = queryParams.tab ? this.tabs.indexOf(queryParams.tab) : null;

        this.state = {
            traceTree: null,
            spans: [],
            selectedTabIndex: (preSelectedTab && preSelectedTab !== -1 ? preSelectedTab : 0),
            isLoading: false,
            errorMessage: null
        };

        this.traceViewRef = React.createRef();
    }

    componentDidMount = () => {
        this.loadTrace();
    };

    componentDidUpdate = () => {
        if (this.traceViewRef.current && this.traceViewRef.current.draw) {
            this.traceViewRef.current.draw();
        }
    };

    loadTrace = () => {
        const {globalState, match} = this.props;
        const traceId = match.params.traceId;
        const self = this;

        self.setState({
            traceTree: null,
            spans: []
        });
        NotificationUtils.showLoadingOverlay("Loading trace", globalState);
        self.setState({
            isLoading: true
        });
        const globalFilter = globalState.get(StateHolder.GLOBAL_FILTER);
        const pathPrefix = `/runtimes/${globalFilter.runtime}/namespaces/${globalFilter.namespace}`;
        HttpUtils.callObservabilityAPI(
            {
                url: `${pathPrefix}/tracing/traces/${traceId}`,
                method: "GET"
            },
            globalState
        ).then((data) => {
            const spans = data.map((dataItem) => new Span({
                traceId: dataItem[0],
                spanId: dataItem[1],
                parentId: dataItem[2],
                namespace: dataItem[3],
                instance: dataItem[4],
                instanceKind: dataItem[5],
                serviceName: dataItem[6],
                pod: dataItem[7],
                operationName: dataItem[8],
                kind: dataItem[9],
                startTime: dataItem[10],
                duration: dataItem[11],
                tags: dataItem[12]
            }));

            if (spans.length > 0) {
                try {
                    const rootSpan = TracingUtils.buildTree(spans);
                    TracingUtils.labelSpanTree(rootSpan);

                    self.setState({
                        traceTree: rootSpan,
                        spans: TracingUtils.getOrderedList(rootSpan)
                    });
                } catch (e) {
                    NotificationUtils.showNotification(
                        "Unable to Render Invalid Trace", NotificationUtils.Levels.ERROR, globalState);
                    self.setState({
                        errorMessage: e.message
                    });
                }
            }
            NotificationUtils.hideLoadingOverlay(globalState);
            self.setState({
                isLoading: false
            });
        }).catch((error) => {
            View.logger.error(`Failed to load trace ${traceId}`, error);
            NotificationUtils.hideLoadingOverlay(globalState);
            self.setState({
                isLoading: false
            });
            NotificationUtils.showNotification(
                `Failed to fetch Trace with ID ${traceId}`,
                NotificationUtils.Levels.ERROR,
                globalState
            );
        });
    };

    handleTabChange = (event, value) => {
        const {history, location, match} = this.props;

        this.setState({
            selectedTabIndex: value
        });

        // Updating the Browser URL
        const queryParamsString = HttpUtils.generateQueryParamString({
            ...HttpUtils.parseQueryParams(location.search),
            tab: this.tabs[value]
        });
        history.replace(match.url + queryParamsString, {
            ...location.state
        });
    };

    render = () => {
        const {classes, location, match} = this.props;
        const {spans, selectedTabIndex, isLoading, errorMessage, traceTree} = this.state;
        const selectedComponent = location.state ? location.state.selectedComponent : null;

        const traceId = match.params.traceId;

        const tabContent = [Timeline, SequenceDiagram, DependencyDiagram];
        const SelectedTabContent = tabContent[selectedTabIndex];

        let view;
        if (isLoading || (spans && spans.length)) {
            view = (
                <ErrorBoundary title={"Unable to render Invalid Trace"}>
                    <SelectedTabContent spans={spans} innerRef={this.traceViewRef}
                        selectedComponent={selectedComponent}/>
                </ErrorBoundary>
            );
        } else if (errorMessage) {
            view = <UnknownError title={"Unable to Render Trace"} description={errorMessage}/>;
        } else {
            view = <NotFound title={"Unable to find Trace"} description={`Trace with ID "${traceId}" Not Found`}/>;
        }

        return (
            <React.Fragment>
                <TopToolbar
                    title={traceTree
                        ? (traceTree.instance ? `${traceTree.instance.name}:` : "") + traceTree.serviceName
                        : "Distributed Tracing"}
                    subTitle={traceTree ? traceTree.operationName : ""} hideNamespaceSelector={true}/>
                <Paper className={classes.container}>
                    <Tabs value={selectedTabIndex} indicatorColor="primary"
                        onChange={this.handleTabChange} className={classes.tabs}>
                        <Tab label="Timeline"/>
                        <Tab label="Sequence Diagram"/>
                        <Tab label="Dependency Diagram"/>
                    </Tabs>
                    {isLoading ? null : view}
                </Paper>
            </React.Fragment>
        );
    };

}

View.propTypes = {
    classes: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired,
    match: PropTypes.shape({
        params: PropTypes.shape({
            traceId: PropTypes.string.isRequired
        }).isRequired
    }).isRequired,
    history: PropTypes.shape({
        replace: PropTypes.func.isRequired
    }),
    location: PropTypes.shape({
        search: PropTypes.string.isRequired,
        state: PropTypes.shape({
            selectedComponent: PropTypes.shape({
                instanceName: PropTypes.string.isRequired,
                serviceName: PropTypes.string.isRequired
            })
        })
    }).isRequired
};

export default withStyles(styles)(withGlobalState(View));
