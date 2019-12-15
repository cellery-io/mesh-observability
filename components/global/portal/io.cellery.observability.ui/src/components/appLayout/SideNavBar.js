/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import Constants from "../../utils/constants";
import Divider from "@material-ui/core/Divider/Divider";
import Drawer from "@material-ui/core/Drawer/Drawer";
import IconButton from "@material-ui/core/IconButton/IconButton";
import InstancesIcon from "../../icons/InstancesIcon";
import List from "@material-ui/core/List/List";
import ListItem from "@material-ui/core/ListItem/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText/ListItemText";
import OverviewIcon from "../../icons/OverviewIcon";
import React from "react";
import Timeline from "@material-ui/icons/Timeline";
import Tooltip from "@material-ui/core/Tooltip/Tooltip";
import classNames from "classnames";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core";
import * as PropTypes from "prop-types";

const styles = (theme) => ({
    drawer: {
        width: Constants.Dashboard.SIDE_NAV_BAR_WIDTH,
        flexShrink: 0,
        whiteSpace: "nowrap"
    },
    drawerOpen: {
        width: Constants.Dashboard.SIDE_NAV_BAR_WIDTH,
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        })
    },
    drawerClose: {
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        overflowX: "hidden",
        width: theme.spacing.unit * 7 + 1,
        [theme.breakpoints.up("sm")]: {
            width: theme.spacing.unit * 9 + 1
        }
    },
    toolbar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 8px",
        ...theme.mixins.toolbar
    },
    list: {
        paddingTop: 0
    },
    listIcon: {
        paddingLeft: theme.spacing.unit
    },
    active: {
        color: theme.palette.primary.main,
        fontWeight: 500
    }
});

class SideNavBar extends React.Component {

    handleSideNavBarClose = () => {
        const {onSideNavBarClose} = this.props;
        if (onSideNavBarClose) {
            onSideNavBarClose();
        }
    };

    handleNavItemClick = (path) => {
        const {history} = this.props;

        history.push(path, {
            hideBackButton: true
        });
    };

    render() {
        const {classes, theme, location, isSideNavBarOpen} = this.props;

        const pages = [
            "/",
            "/instances",
            "/tracing"
        ];
        let selectedIndex = 0;
        for (let i = 0; i < pages.length; i++) {
            if (location.pathname.startsWith(pages[i])) {
                selectedIndex = i;
            }
        }

        return (
            <Drawer variant="permanent" open={isSideNavBarOpen}
                className={classNames(classes.drawer, {
                    [classes.drawerOpen]: isSideNavBarOpen,
                    [classes.drawerClose]: !isSideNavBarOpen
                })}
                classes={{
                    paper: classNames({
                        [classes.drawerOpen]: isSideNavBarOpen,
                        [classes.drawerClose]: !isSideNavBarOpen
                    })
                }}>
                <div className={classes.toolbar}>
                    <IconButton onClick={this.handleSideNavBarClose}>
                        {theme.direction === "rtl" ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                    </IconButton>
                </div>
                <Divider/>
                <List className={classes.list}>
                    <Tooltip title="Overview" placement="right" disableFocusListener={isSideNavBarOpen}
                        disableHoverListener={isSideNavBarOpen} disableTouchListener={isSideNavBarOpen}>
                        <ListItem index={0} button key="Overview"
                            className={classNames({[classes.active]: selectedIndex === 0})}
                            onClick={(event) => {
                                this.handleNavItemClick(pages[0], event);
                            }}>
                            <ListItemIcon className={classes.listIcon}>
                                <OverviewIcon className={classNames({[classes.active]: selectedIndex === 0})}/>
                            </ListItemIcon>
                            <ListItemText primary="Overview"
                                classes={{primary: classNames({[classes.active]: selectedIndex === 0})}}/>
                        </ListItem>
                    </Tooltip>
                    <Tooltip title="Instances" placement="right" disableFocusListener={isSideNavBarOpen}
                        disableHoverListener={isSideNavBarOpen} disableTouchListener={isSideNavBarOpen}>
                        <ListItem index={1} button key="Instances"
                            className={classNames({[classes.active]: selectedIndex === 1})}
                            onClick={(event) => {
                                this.handleNavItemClick(pages[1], event);
                            }}>
                            <ListItemIcon className={classes.listIcon}>
                                <InstancesIcon className={classNames({[classes.active]: selectedIndex === 1})}/>
                            </ListItemIcon>
                            <ListItemText primary="Instances"
                                classes={{primary: classNames({[classes.active]: selectedIndex === 1})}}/>
                        </ListItem></Tooltip>
                    <Tooltip title="Distributed Tracing" placement="right"
                        disableFocusListener={isSideNavBarOpen} disableHoverListener={isSideNavBarOpen}
                        disableTouchListener={isSideNavBarOpen}>
                        <ListItem index={2} button key="Distributed Tracing"
                            className={classNames({[classes.active]: selectedIndex === 2})}
                            onClick={(event) => {
                                this.handleNavItemClick(pages[2], event);
                            }}>
                            <ListItemIcon className={classes.listIcon}>
                                <Timeline className={classNames({[classes.active]: selectedIndex === 2})}/>
                            </ListItemIcon>
                            <ListItemText primary="Distributed Tracing"
                                classes={{primary: classNames({[classes.active]: selectedIndex === 2})}}/>
                        </ListItem>
                    </Tooltip>
                </List>
            </Drawer>
        );
    }

}

SideNavBar.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        push: PropTypes.func.isRequired
    }).isRequired,
    location: PropTypes.shape({
        pathname: PropTypes.string.isRequired
    }),
    theme: PropTypes.object.isRequired,
    onSideNavBarClose: PropTypes.func.isRequired,
    isSideNavBarOpen: PropTypes.bool.isRequired
};

export default withStyles(styles, {withTheme: true})(withRouter(SideNavBar));
