//Namespace.provide('App');
//Namespace.provide('App.Util');
//Namespace.provide('App.Captcha');

/**
 * @namespace App
 */
Namespace('App', class App {
    /**
     * @static
     * @private
     * @type {*}
     */
    static registry = new Map();
    /**
     * @static
     * @private
     * @type {*}
     */
    static libs = new Map();

    /**
     * @static
     * @return {Object.<string, mixed>|String|Array}
     */
    static get data() {
        return this.registry.get('appData');
    }

    /**
     * @static
     * @param {*} data
     * @return {Map}
     */
    static set data(data) {
        return this.registry.set('appData', data);
    }

    /**
     * @static
     * @return {*}
     */
    static get vars() {
        return this.registry.get('vars');
    }

    /**
     * @static
     * @param {*} data
     * @return {Map}
     */
    static set vars(data) {
        return this.registry.set('vars', data);
    }

    /**
     * @static
     * @return {*}
     */
    static get lodash() {
        return this.libs.get('lodash');
    }

    /**
     * @static
     * @param {Object} $l   Lodash instance
     * @return {Map}
     */
    static set lodash($l) {
        return this.libs.set('lodash', $l);
    }

    // static get opts() {
    //     return this.$registry.get('opts');
    // }
    //
    // static set opts(opts) {
    //     return this.$registry.set('opts', opts);
    // }

    /**
     * @static
     * @return {Object.<string, integer>|Array}
     */
    static get counters() {
        return this.registry.get('counters');
    }

    /**
     * @static
     * @param {Object.<string, integer>|Array} data
     * @return {Map}
     */
    static set counters(data) {
        return this.registry.set('counters', data);
    }

    /**
     * @static
     * @return {boolean|integer}
     */
    static get userId() {
        if (this.data != null && this.data['userId']) {
            return this.data['userId'];
        }
        return false;
    }
});

Namespace('App.Util', class AppUtil {
    static addEventListener(...opts) {
        let [$el, $ev, $func] = opts;

        if (typeof($el) == 'object') {
            return $el.addEventListener($ev, $func);
        }

        return false;
    }

    static fireEvent(...opts) {
        let [$el, $ev, $cdata] = opts;
        let $ = App.lodash;

        if ($cdata && $.size($cdata) > 0) {
            $ev = new CustomEvent($ev, $cdata);
        } else {
            $ev = new Event($ev);
        }

        return $el.dispatchEvent($ev);
    }

    static removeEventListener(...opts) {
        let [$el, $ev, $func] = opts;
        return $el.removeEventListener($ev, $func);
    }

    static isFunction(func) {
        return typeof(func) === 'function';
    }
});

Namespace('App.XHR', class AppXHR {
    static prepare({ params = {}, json = false, html = false }) {
        const _ = App.lodash;
        let headers = {};

        _.defaults(params, {
            headers: {},
            redirect: 'follow',
            cache: 'no-cache'
        });

        let body = '';

        if(params.json) {
            //query = ($.size(query) > 0) ? JSON.stringify(query) : query;
            headers = { 'Content-Type': 'application/json' };
            body = JSON.stringify(params.body);
        } else if(params.html) {
            headers = { 'Content-Type': 'text/html' };
        } else {
            headers = { 'Content-Type': 'text/plain' };
        }

        _.defaultsDeep(params, { headers: headers });
        _.unset(params, 'json');
        _.unset(params, 'html');

        return params;
    }

    static _fetch(uri, { params = { json: true, html: false }, success, error }) {
        params = this.prepare({ params: params });

        App.lodash.defaults(params, {
            method: 'GET'
        });

        success = App.Util.isFunction(success) ? success : (res) => { App.Util.fireEvent(window, 'xhr:success', { data: res }); };
        error   = App.Util.isFunction(error) ? error : (res) => { App.Util.fireEvent(window, 'xhr:error', { data: res }); };

        return fetch(uri, params).then(res => {
            if (res.ok) {
                if (success) success(res);
            } else {
                if (error) error(res);
            }
            return res;
        });
    }

    static get(uri, { params = { json: true, html: false }, success, error }) {
        return this._fetch(uri, {
            params: params,
            success: success,
            error: error
        });
    }
    static getJSON(uri, { params = {}, success = false, error = false }) {
        App.lodash.defaults(params, { json: true });

        return this.get(uri, {
            params: params,
            success: success,
            error: error
        });
    }

    static post(uri, { params = {}, success = false, error = false }) {
        App.lodash.defaults(params, { method: 'POST' });

        return this._fetch(uri, {
            params: params,
            success: success,
            error: error
        });
    }

    static postJSON(uri, { params = {}, success = false, error = false }) {
        console.log(params);
        App.lodash.defaults(params, { json: true });

        return this.post(uri, {
            params: params,
            success: success,
            error: error
        });
    }

    static put(uri, { params, success, error }) {
        App.lodash.defaults(params, { method: 'PUT' });

        return this._fetch(uri, {
            params: params,
            success: success,
            error: error
        })
    }
});

Namespace('App.Captcha', class AppCaptcha {
    static errors = {
        'f4388ea3c2dc54c78ec145249ed13e76': 'Указаны неверные данные',
        'cc6dc88595642692077ae31263c77623': 'Логин может содержать латинские символы (a-zA-z), числа(0-9) и нижнее подчеркивание (_)',
        '2bf442052b2ceec4012a36b729e2d26a': 'Логин не может быть менее 2 символов',
        'b6d538e20a4a4a3fc5539589b36c4d6b': 'Логин не может быть более 32 символов',
        'b6d538e20a4a4a3fc5539589b36c4d6y': 'Логин содержит недопустимое слово',
        '8b6bf8b22b8a45716dec01b06d924915': 'Пароль не может быть менее 8 символов',
        '6664d1acf40eca24b4e160f6d95efd75': 'Пароль не может быть более 128 символов',
        'e9b2ff28866f0cd2eb97bec9eebb5c10': 'Пароли не совпадают',
        '66239c9b90b1e25406ada5eb28576994': 'Логин недоступен для регистрации',
        'fb54f3c5992b96d001bb16e8e92d968d': 'Магазин с таким названием уже зарегистрирован',
        '70b29c4920daf4e51e8175179027e668': 'Проверочный код указан неверно',
        '80fad2fda354455e59bfda95e080d52f': 'Истекло время жизни проверочного кода',
        'e37123567adebee220856860099b1dea': 'Доступ ограничен',
        '2ceec4012a36b7ee2208dsa1qa568600': 'Аккаунт зарегистрирован. Добро пожаловать',
        'd023f0781628037a3b8ad023f0781628': 'Вход на сайт доступен только активным пользователям',
        'b6d538e20a4a4a3fc5539589b36c4d6e': 'Регистрация через тор временно закрыта'
    };

    static load() {
        const endpoint = '/regcaptcha';

        return App.XHR.getJSON(endpoint, {});
    }

    static showErrorsIfPresents() {
        let $ = App.lodash;
        let url = new URL(document.location.href);
        let e = url.searchParams.get('e');
        let error = '';

        if ($.size(e) > 0) {
            error = this.errors[e];
            if (!error) {
                error = 'Произошла неопознанная ошибка';
            }
            addAlert(error);
        }

    }

    static errorLoad() {
        let cont = document.querySelector('form');
        cont.innerHTML = '<a href="/" class="btn btn-warning btn-block">Ошибка. Попробуйте еще раз</a>';
        window.location.href = '/';
    }

    static init(form) {
        App.Captcha.showErrorsIfPresents();
        let dataKey = form.getAttribute('x-data');
        if (dataKey) {
            return Alpine.data(dataKey, () => ({
                task : "",
                body : "",
                playField : "",
                currentPointCount : 0,
                points : [],
                result : "",
                captchaField : {},
                MAX_POINT_COUNT : 7,
                imageHtml : {},
                deltaX : 1,
                deltaY : 1,


                init() {
                    this.loadCaptcha();
                    this.playField = form.querySelector('.play-field');
                    this.captchaField = form.querySelector('input[name=captcha]');
                    this.imageHtml = form.querySelector('img#captchaBody');

                    let t = this;

                    window.addEventListener("resize", function(e){
                        t.onResize();
                    });

                },

                onImageBodyLoad(){
                    this.calculateDelta();
                },

                onResize(e){
                    if(!this.imageHtml.complete){
                        return false;
                    }

                    this.calculateDelta();
                    this.resetAll();
                },

                calculateDelta(){
                    let imageBody = this.imageHtml;

                    this.deltaX = imageBody.width / imageBody.naturalWidth;
                    this.deltaY = imageBody.height / imageBody.naturalHeight;

                    console.log(this.deltaX);
                },

                getPointInstance : function(X,Y){
                    let t = this;

                    return {
                        x : X,
                        y : Y,

                        normalize(deltaX, deltaY){
                            return t.getPointInstance(this.x / deltaX, this.y / deltaY);
                        },

                        toString(){
                            return this.x + "_" + this.y;
                        }
                    };
                },

                setPoint(e){

                    if(this.points.length >= this.MAX_POINT_COUNT){
                        return false;
                    }

                    let pointViewMatrix = this.getPointInstance(e.layerX, e.layerY);
                    let pointNormalized = pointViewMatrix.normalize(this.deltaX, this.deltaY);

                    let HtmlPoint = this.createHtmlPoint(pointViewMatrix, this.points.length + 1);


                    console.log(pointViewMatrix);
                    console.log(pointNormalized);

                    this.playField.append(HtmlPoint);
                    this.points.push(HtmlPoint);

                    this.result += pointNormalized + "__";

                    this.captchaField.value = this.result.slice(0, -2);
                },

                resetAll(){
                    this.resetPoints();
                    this.result = "";
                    this.captchaField.value = "";
                },

                resetPoints(){
                    for(let key in this.points){
                        let entry = this.points[key];
                        entry.remove();
                    }

                    this.points = [];
                },


                /* Retruns html representation of point */
                createHtmlPoint(point, content){
                    let HtmlPoint = document.createElement("div");

                    HtmlPoint.classList.add("point");


                    /* TODO: - 10 px replace with (HTMLPoint.innerWidth / 2) /*/
                    HtmlPoint.style.left = (point.x  - 10) + "px";
                    HtmlPoint.style.top = (point.y - 10) + "px";

                    HtmlPoint.innerHTML = content;

                    return HtmlPoint;
                },

                async loadCaptcha(){
                  form.querySelector("#loader").classList.remove("hidden");
                  form.querySelector("#captcha-present").classList.add("hidden");
                  let t = this;
                  let isNotLoaded = true;


                    while(isNotLoaded){
                       let result = await App.Captcha.load();
                       if(result.ok){
                          try{
                            let data = await result.json();
                            if (data.task !== undefined) {
                                t.task = data.task;
                                t.body = data.body;
                                isNotLoaded = false;
                                this.renderCaptcha();
                                break;
                            } else {
                                App.Captcha.errorLoad();
                                break;
                            }
                          }catch(error){
                            if (result.redirected) {
                                if (result.url && result.url.substr(-8) == "/captcha") {
                                    App.Captcha.errorLoad();
                                    break;
                                }
                            }
                            continue;
                          }

                          break;
                       } else {
                       }
                    }
                },

                renderCaptcha(){
                  if(this.task !== ''){
                    form.querySelector("#loader").classList.add("hidden");
                    form.querySelector("#captcha-present").classList.remove("hidden");
                  }
                },
            }));
        }
    }
});

Namespace('App.Modal', class AppModal {
    static $sel = {
        container: 'div#Modal',
        msgArea: 'div#Modal > div.modal-dialog > div.modal-content'
    }

    static setMessage(msg) {
        this.getMessageArea().innerHTML = `<div style="padding: 30px">${msg}</div>`;
    }

    static reset() {
        this.hide();
        this.setMessage('');
    }

    static show() {
        this.getContainer().className = 'modal show';
    }

    static hide() {
        this.getContainer().className = 'modal';
    }

    static getContainer() {
        return document.querySelector(this.$sel.container);
    }

    static getMessageArea() {
        return document.querySelector(this.$sel.msgArea);
    }

    static open(msg) {
        this.reset();
        this.setMessage(msg);
        this.show();
    }
});


class NoPlaneException {
  constructor(error){
    this.msg = error;
  }
}

function countPlainInAP(aeroport){

  let count = 3;

  if(aeroport.plane === "undefine"){
    throw new NoPlaneException("Some error");
  }

  return count;
}

function setFromsConfirmation() {
    let forms = document.querySelectorAll('form[confirmation]');
    for (var form of forms) {
        form.addEventListener('submit', confirmationHandler);
        form.solved = 0;
    }
}

function closeModal(e) {
    let modal = document.getElementById('Modal');
    let modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = "";
    modal.className = "modal";
}
function closeModalFix(e){
    e.stopPropagation();
}

function challengePassed(form, code) {
    form.solved = 1;

    let el = document.createElement('input');
    el.type = "hidden";
    el.name = "authToken";
    el.value = code;
    form.appendChild(el);

    form.submit();
}

function addAlert(message, cls="danger") {
    let el = document.createElement('div');
    el.className = `alarm alert alert-${cls}`;
    el.innerText = message;
    document.querySelector('#Alarms').appendChild(el);
}

function authAndGo(e) {
    e.preventDefault();
    let form = e.target;
    let formData = new FormData(form);
    let modal = document.getElementById('Modal');
    let modalContent = modal.querySelector('.modal-content');
    let loader = modal.querySelector(".modal-loader");

    let xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open("POST", form.getAttribute('action'));
    xhr.onreadystatechange = function(e) {
        if(xhr.readyState == 4 && xhr.status == 200) {
            let code = xhr.response.message;
            let result = xhr.response.result;
            if (result == true) {
                challengePassed(form.previousForm, code);
            } else {
                addAlert(code);
            }
            closeModal(null);
        }
    }
    xhr.send(formData);
}


function confirmationHandler(e) {
    let form = e.target;
    if (form.solved == 1) {
      return true
    }

    e.preventDefault();

    let modal = document.getElementById('Modal');
    let modalContent = modal.querySelector('.modal-content');
    let loader = modal.querySelector(".modal-loader");
    let confirmButton = null;

    let xhr = new XMLHttpRequest();
    console.log(modalContent);
    loader.className = "modal-loader";
    modal.className = "modal show";
    modal.addEventListener('click', closeModal);
    modalContent.addEventListener('click', closeModalFix);
    xhr.onreadystatechange = function(e) {
        if(xhr.readyState == 4 && xhr.status == 200) {
            let result = xhr.responseText;
            loader.className = "modal-loader hidden";
            let buffer = document.createElement('div');
            buffer.innerHTML = result;
            for (var el of buffer.children) {
                modalContent.appendChild(el.cloneNode(true));
            }
            modalForm = modalContent.querySelector('form');
            modalForm.addEventListener("submit", authAndGo);
            modalForm.previousForm = form;
        };
    };
    xhr.open("GET", '/confirmation/auth', false);
    xhr.send();

}

function copyToClipboard(el) {
    let sel = el.disabled;
    if (sel) {
        el.disabled = false;
    }
    el.focus();
    el.select();
    try {
        document.execCommand('copy');
        addAlert('Текст скопирован', 'info');

    } catch (err) {
        addAlert('Ошибка. Текст не скопирован');
    }
    if (sel) {
        el.disabled = true;
    }
}


function timer(expiry) {
  return {
    expiry: expiry,
    remaining:null,
    init() {
      this.setRemaining()
      setInterval(() => {
        this.setRemaining();
      }, 1000);
    },
    setRemaining() {
      const diff = this.expiry - new Date().getTime();
      this.remaining =  parseInt(diff / 1000);
    },
    days() {
      return {
        value:this.remaining / 86400,
        remaining:this.remaining % 86400
      };
    },
    hours() {
      return {
        value:this.days().remaining / 3600,
        remaining:this.days().remaining % 3600
      };
    },
    minutes() {
        return {
        value:this.hours().remaining / 60,
        remaining:this.hours().remaining % 60
      };
    },
    seconds() {
        return {
        value:this.minutes().remaining,
      };
    },
    format(value) {
      return ("0" + parseInt(value)).slice(-2)
    },
    time(){
        return {
        days:this.format(this.days().value),
        hours:this.format(this.hours().value),
        minutes:this.format(this.minutes().value),
        seconds:this.format(this.seconds().value),
      }
    },
  }
}


function capitalize(datastring) {
    return datastring.charAt(0).toUpperCase() + datastring.slice(1);
}


function copy(id) {
    let element = document.querySelector(id);
    var textArea = document.createElement('textarea');

    textArea.value = element.textContent;
    textArea.style = {position: 'absolute', left: '-9999px'};

    document.body.appendChild(textArea);
    copyToClipboard(textArea);
    document.body.removeChild(textArea);
}

function timer(expiry) {
  return {
    expiry: expiry,
    remaining:null,
    init() {
      this.setRemaining()
      setInterval(() => {
        this.setRemaining();
      }, 1000);
    },
    setRemaining() {
      const diff = this.expiry - new Date().getTime();
      this.remaining =  parseInt(diff / 1000);
    },
    days() {
      return {
        value:this.remaining / 86400,
        remaining:this.remaining % 86400
      };
    },
    hours() {
      return {
        value:this.days().remaining / 3600,
        remaining:this.days().remaining % 3600
      };
    },
    minutes() {
        return {
        value:this.hours().remaining / 60,
        remaining:this.hours().remaining % 60
      };
    },
    seconds() {
        return {
        value:this.minutes().remaining,
      };
    },
    format(value) {
      return ("0" + parseInt(value)).slice(-2)
    },
    time(){
        return {
        days:this.format(this.days().value),
        hours:this.format(this.hours().value),
        minutes:this.format(this.minutes().value),
        seconds:this.format(this.seconds().value),
      }
    },
  }
}
