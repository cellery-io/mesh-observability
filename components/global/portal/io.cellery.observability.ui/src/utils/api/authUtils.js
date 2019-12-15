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

import Constants from "../constants";
import HttpUtils from "./httpUtils";
import Logger from "js-logger";
import NotificationUtils from "../common/notificationUtils";
import {StateHolder} from "../../components/common/state";
import jwtDecode from "jwt-decode";

/**
 * Authentication/Authorization related utilities.
 */

class AuthUtils {

    static logger = Logger.get("utils/api/authUtils");

    /**
     * Sign in the user.
     *
     * @param {Object} user The user to be signed in
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static signIn = (user, globalState) => {
        if (user.username) {
            AuthUtils.updateUser(user, globalState);
        } else {
            throw Error(`Username provided cannot be "${user.username}"`);
        }
    };

    /**
     * Redirects the user to IDP for authentication.
     *
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static initiateLoginFlow(globalState) {
        HttpUtils.callObservabilityAPI(
            {
                url: "/auth/client-id",
                method: "GET"
            },
            globalState
        ).then((resp) => {
            window.location.href
                = `${globalState.get(StateHolder.CONFIG).idp.idpURL}${Constants.Dashboard.AUTHORIZATION_EP}`
                + `&client_id=${resp}&`
                + `redirect_uri=${globalState.get(StateHolder.CONFIG).idp.callBackURL}&nonce=auth&scope=openid`;
        }).catch((error) => {
            AuthUtils.logger.error("Failed to get Observability Portal client ID", error);
            throw Error(`Failed to redirect to Identity Provider for Authentication. ${error}`);
        });
    }

    /**
     * Redirects the user to IDP after Access token has expired.
     *
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static redirectForTokenRefresh(globalState) {
        localStorage.removeItem(StateHolder.USER);
        globalState.unset(StateHolder.USER);
        this.initiateLoginFlow(globalState);
    }

    /**
     * Requests the API backend for tokens in exchange for authorization code.
     *
     * @param {string} oneTimeCode The one time Authorization code given by the IDP.
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static getTokens(oneTimeCode, globalState) {
        HttpUtils.callObservabilityAPI(
            {
                url: `/auth/tokens/${oneTimeCode}`,
                method: "GET"
            },
            globalState
        ).then((resp) => {
            const decodedToken = jwtDecode(resp.id_token);
            const user = {
                username: decodedToken.sub,
                accessToken: resp.access_token,
                idToken: resp.id_token
            };
            AuthUtils.signIn(user, globalState);
        }).catch((error) => {
            AuthUtils.logger.error("Failed to exchange access token for auth code", error);
            NotificationUtils.showNotification("Authentication Failed", NotificationUtils.Levels.ERROR, globalState);
        });
    }

    /**
     * Updates the StateHolder and localStorage with new user object.
     *
     * @param {Object} user The user object which has been created.
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static updateUser = (user, globalState) => {
        localStorage.setItem(StateHolder.USER, JSON.stringify(user));
        globalState.set(StateHolder.USER, user);
    };

    /**
     * Sign out the current user.
     * The provided global state will be updated accordingly as well.
     *
     * @param {StateHolder} globalState The global state provided to the current component
     */
    static signOut = (globalState) => {
        const idToken = globalState.get(StateHolder.USER).idToken;
        localStorage.removeItem(StateHolder.USER);
        window.location.href = `${globalState.get(StateHolder.CONFIG).idp.idpURL}/oidc/logout?id_token_hint=`
            + `${idToken}&post_logout_redirect_uri=${globalState.get(StateHolder.CONFIG).idp.callBackURL}`;
    };

    /**
     * Get the currently authenticated user.
     *
     * @returns {string} The current user
     */
    static getAuthenticatedUser = () => {
        let user;
        try {
            user = JSON.parse(localStorage.getItem(StateHolder.USER));
        } catch {
            user = null;
            localStorage.removeItem(StateHolder.USER);
        }
        return user;
    };

}

export default AuthUtils;
