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

import CellDependencyView from "./CellDependencyView";
import ColorGenerator from "../../common/color/colorGenerator";
import HealthIndicator from "../../common/HealthIndicator";
import HttpUtils from "../../../utils/api/httpUtils";
import NotificationUtils from "../../../utils/common/notificationUtils";
import QueryUtils from "../../../utils/common/queryUtils";
import React from "react";
import StateHolder from "../../common/state/stateHolder";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography/Typography";
import withColor from "../../common/color";
import withGlobalState from "../../common/state";
import {withStyles} from "@material-ui/core/styles";
import * as PropTypes from "prop-types";

const styles = () => ({
    root: {
        display: "flex"
    },
    table: {
        width: "30%",
        marginTop: 25
    },
    tableCell: {
        borderBottom: "none"
    }
});

class Details extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isDataAvailable: false,
            health: -1,
            dependencyGraphData: [],
            isLoading: false,
            ingressTypes: []
        };
    }

    componentDidMount = () => {
        const {globalState} = this.props;

        this.update(
            true,
            QueryUtils.parseTime(globalState.get(StateHolder.GLOBAL_FILTER).startTime),
            QueryUtils.parseTime(globalState.get(StateHolder.GLOBAL_FILTER).endTime)
        );
    };

    update = (isUserAction, queryStartTime, queryEndTime) => {
        const {globalState, cell} = this.props;
        const self = this;

        const search = {
            queryStartTime: queryStartTime.valueOf(),
            queryEndTime: queryEndTime.valueOf(),
            destinationInstance: cell,
            includeIntraInstance: true
        };

        const ingressQueryParams = {
            queryStartTime: queryStartTime.valueOf(),
            queryEndTime: queryEndTime.valueOf()
        };

        const cellMetricsPromise = HttpUtils.callObservabilityAPI(
            {
                url: `/http-requests/instances/metrics/${HttpUtils.generateQueryParamString(search)}`,
                method: "GET"
            }, globalState);

        const ingressDataPromise = HttpUtils.callObservabilityAPI(
            {
                url: `/k8s/instances/${cell}${HttpUtils.generateQueryParamString(ingressQueryParams)}`,
                method: "GET"
            }, this.props.globalState);

        if (isUserAction) {
            NotificationUtils.showLoadingOverlay("Loading Cell Info", globalState);
            self.setState({
                isLoading: true
            });
        }
        Promise.all([cellMetricsPromise, ingressDataPromise]).then((data) => {
            const cellInfoData = data[1];
            self.loadCellMetrics(data[0]);
            const ingressTypesSet = new Set();
            for (let i = 0; i < cellInfoData.length; i++) {
                const ingressDatum = cellInfoData[i];
                const ingressTypeArray = ingressDatum[2].split(",");
                ingressTypeArray.forEach((ingressValue) => {
                    ingressTypesSet.add(ingressValue);
                });
            }
            self.setState({
                ingressTypes: Array.from(ingressTypesSet)
            });
            if (isUserAction) {
                NotificationUtils.hideLoadingOverlay(globalState);
                self.setState({
                    isLoading: false
                });
            }
        }).catch(() => {
            if (isUserAction) {
                NotificationUtils.hideLoadingOverlay(globalState);
                self.setState({
                    isLoading: false
                });
                NotificationUtils.showNotification(
                    "Failed to load cell information",
                    NotificationUtils.Levels.ERROR,
                    globalState
                );
            }
        });
    };

    loadCellMetrics = (data) => {
        const self = this;
        const aggregatedData = data.map((datum) => ({
            isError: datum[1] === "5xx",
            count: datum[5]
        })).reduce((accumulator, currentValue) => {
            if (currentValue.isError) {
                accumulator.errorsCount += currentValue.count;
            }
            accumulator.total += currentValue.count;
            return accumulator;
        }, {
            errorsCount: 0,
            total: 0
        });

        let health;
        if (aggregatedData.total > 0) {
            health = 1 - aggregatedData.errorsCount / aggregatedData.total;
        } else {
            health = -1;
        }

        self.setState({
            health: health,
            isDataAvailable: aggregatedData.total > 0
        });
    };

    render = () => {
        const {classes, cell} = this.props;
        const {health, isLoading, ingressTypes} = this.state;
        const view = (
            <Table className={classes.table}>
                <TableBody>
                    <TableRow>
                        <TableCell className={classes.tableCell}>
                            <Typography color="textSecondary">
                                Health
                            </Typography>
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            <HealthIndicator value={health}/>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className={classes.tableCell}>
                            <Typography color="textSecondary">
                                Ingress Types
                            </Typography>
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                            <p>{ingressTypes.length > 0 ? ingressTypes.join(", ") : "Not Available"}</p>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );

        return (
            <React.Fragment>
                {isLoading ? null : view}
                <CellDependencyView cell={cell} className={classes.root}/>
            </React.Fragment>
        );
    }

}

Details.propTypes = {
    classes: PropTypes.object.isRequired,
    colorGenerator: PropTypes.instanceOf(ColorGenerator).isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired,
    cell: PropTypes.string.isRequired
};

export default withStyles(styles)(withColor(withGlobalState(Details)));

