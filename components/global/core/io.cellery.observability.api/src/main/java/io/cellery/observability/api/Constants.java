/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
package io.cellery.observability.api;

/**
 * This class defines the constants that are used by the observability API component.
 */
public class Constants {
    private Constants() {
    }

    public static final String REQUEST_PROPERTY_ACCESS_TOKEN = "ACCESS_TOKEN";

    public static final String ACCESS_CONTROL_ALLOW_ORIGIN = "Access-Control-Allow-Origin";
    public static final String ACCESS_CONTROL_ALLOW_METHODS = "Access-Control-Allow-Methods";
    public static final String ACCESS_CONTROL_ALLOW_HEADERS = "Access-Control-Allow-Headers";
    public static final String ACCESS_CONTROL_MAX_AGE = "Access-Control-Max-Age";
    public static final String ACCESS_CONTROL_ALLOW_CREDENTIALS = "Access-Control-Allow-Credentials";
    public static final String MAX_AGE = "3600";

    public static final String ALL_ORIGIN = "*";
    public static final String ORIGIN = "Origin";

    public static final String TOKEN_ENDPOINT = "/oauth2/token";
    public static final String ACCESS_TOKEN = "access_token";
    public static final String ID_TOKEN = "id_token";
    public static final String HTTP_ONLY_SESSION_COOKIE = "OASID";
}
