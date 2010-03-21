
var requests = new function () {
  this.outstanding = {};
  this.content = '';
  this.idIncr = 0;
  
  this.addRequest = function (param) {
    var reqId = new String(this.idIncr);
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
      this.resp.close();
    }
  };
}();
