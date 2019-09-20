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

package io.cellery.observability.telemetry.receiver.internal;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.wso2.siddhi.core.stream.input.source.SourceEventListener;

import java.io.IOException;

/**
 * This class is responsible for handling metrics received from the http server.
 */
public class MetricsHandler implements HttpHandler {

    private static final Logger log = Logger.getLogger(MetricsHandler.class);
    private static final Gson gson = new Gson();
    private SourceEventListener sourceEventListener;

    public MetricsHandler(SourceEventListener sourceEventListener) {
        this.sourceEventListener = sourceEventListener;
    }

    @Override
    public void handle(HttpExchange httpExchange) throws IOException {
        if (httpExchange.getRequestBody() != null) {
            try {
                String json = IOUtils.toString(httpExchange.getRequestBody());
                if (log.isDebugEnabled()) {
                    log.debug("Received a metric from the adapter : " + json);
                }
                sourceEventListener.onEvent(json, new String[0]);
                httpExchange.sendResponseHeaders(200, -1);
            } catch (IOException e) {
                httpExchange.sendResponseHeaders(500, -1);
            }
        } else {
            httpExchange.sendResponseHeaders(500, -1);
        }
        httpExchange.close();
    }
}
