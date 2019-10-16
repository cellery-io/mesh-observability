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

package memory

import (
	"fmt"

	"go.uber.org/zap"

	"github.com/cellery-io/mesh-observability/components/global/mixer-adapter/pkg/dal"
)

type (
	Persister struct {
		Logger *zap.SugaredLogger
		Buffer chan string
	}
	Cleaner struct {
		Element string
		Buffer  chan string
	}
)

func (cleaner *Cleaner) Commit() error {
	return nil
}

func (cleaner *Cleaner) Rollback() error {
	cleaner.Buffer <- cleaner.Element
	return nil
}

func (persister *Persister) Fetch() (string, dal.Transaction, error) {
	if len(persister.Buffer) > 0 {
		str := <-persister.Buffer
		cleaner := &Cleaner{Element: str}
		return str, cleaner, nil
	} else {
		return "", &Cleaner{}, fmt.Errorf("there is no elements in the buffer")
	}
}

func (persister *Persister) Write(str string) error {
	persister.Buffer <- str
	return nil
}