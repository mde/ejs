/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var requests = new function () {
  this.outstanding = {};
  this.content = '';
  this.idIncr = 0;
  
  this.addRequest = function (param) {
    var reqId = String(this.idIncr);
    this.outstanding[reqId] = {
      method: param.method || 'GET',
      url: param.url,
      data: param.data || null,
      handler: null,
      finished: false
    }
    this.idIncr++;
  };
  this.makeRequests = function () {
    var client = http.createClient(5984, 'localhost');
    for (var p in this.outstanding) {
      this.makeRequest(client, p);
    }
  };
  this.makeRequest = function (client, p) {
    var param = this.outstanding[p];
    var fetchReq = client.request(param.method, param.url);
    fetchReq.addListener('response', function (fetchResp) {
      fetchResp.setBodyEncoding("utf8");

      fetchResp.addListener("data", function (chunk) {
        _this.content += chunk;
      });

      fetchResp.addListener("end", function () {
        _this.outstanding[p].finished = true;
        _this.close.call(_this);
      });

    });
    if (param.data) {
      data = typeof param.data == 'string' ?
        param.data : JSON.stringify(param.data);
      fetchReq.write(data, encoding="utf8");
    }
    fetchReq.close();
  };
  this.finished = function () {
    for (var p in this.outstanding) {
      if (!this.outstanding[p].finished) {
        return false;
      }
    }
    return true;
  };
  this.close = function () {
    if (this.finished()) {
      this.resp.write(this.content);
      this.resp.end();
    }
  };
}();
