/**
 * @translation
 * Detailed documentation on English for this class is on github: www-smart-preloader
 * I wrote code descriptions and comments in English for `config` only, the rest is in Russian.
 * Translate everything into English is in TОDO-list, but google-translate also can :)
 * @global
 */
window.Preloader = class Preloader {
    constructor(callback) {
        if (callback && typeof callback !== 'function') throw Error('callback должно быть функцией');

        /** Ссылка на HTMLElement progressBar
         * @private
         * @type HTMLElement */
        this.progressBar = undefined;
        /** строковый массив dataset-атрибутов, которые подлежат активации сразу после применения внешнего набора правил CSS
         * @type {Array.<string>}
         * @private */
        this._datasetToActivate = [];
        /** массив размера данных в байтах
         * @private
         * @type Array */
        this._targetBytes = [];
        /** массив текущего количества уже скачанных данных
         * @private
         * @type Array */
        this._currentBytes = [];
        /** суммарный размер данных
         * @private
         * @type number */
        this._totalBytes = 0;
        /** время начала загрузки данных
         * @private
         * @type number */
        this._startTime = 0;
        /** применен ли к документу внешний набор стилей (после загрузки и активации) ?
         * @private
         * @type boolean */
        this._cssRulesApplied = false;
        /** условие, становящееся истинным после того, как к DOM применился внешний набор правил CSS
         * @type {string}
         * @private
         * @see activateAfterCssRules */
        this._activateCondition = '';
        /** callback-функция, вызываемая после успешной загрузки
         * @private
         * @type Function|undefined */
        this._callback = callback;
        /** корневой узел, внутри которого производится извлечение url
         * @private
         * @type Document|HTMLElement|undefined */
        this._rootNode = undefined;
        /** строковый массив ссылок для загрузки
         * @private
         * @type Array<string>|undefined */
        this._urls = undefined;
        /** Массив HTMLElement, дочерних к rootNode, и имеющих dataset-атрибуты 'data-...'
         * @private
         * @type NodeList|undefined */
        this._nodeList = undefined;
        /** Boolean-массив состояния загрузки каждого ресурса, false - не загружен, true - загружен
         * @private
         * @type Array<boolean> */
        this._isDownloaded = [];
        /** Boolean-массив состояния активации каждого загруженного(кешированного) ресурса, false - не активирован, true - активирован
         * @private
         * @type Array<boolean> */
        this._isActivated = [];
        /** Используется для отмены всех запросов fetch при ошибке в одном из них.
         * Отменяются только те запросы fetch, у которых указан signal: this._abortSignal в параметре RequestInit
         * @private
         * @type AbortController
         * @example
         * this._abortController = new AbortController();
         * this._abortSignal = this._abortController.signal;
         * fetch('http://example.com/getData.php',
         *      { signal: this._abortSignal });
         * ...
         * this._abortController.abort()} */
        this._abortController = new AbortController();
        /** сигнал AbortController для отмены тех запросов fetch, у которых указан signal: this._abortSignal в параметре RequestInit
         * @private
         * @type AbortSignal
         * @see this._abortController */
        this._abortSignal = this._abortController.signal;
        /** текст ошибки, выводимый пользователю на экран
         * @private
         * @type {string} */
        this._errorMessageForUser = '';
        /** дополняющий текст ошибки, выводимый разработчику в консоль и идущий перед базовым текстом ошибки
         * @private
         * @type {string} */
        this._errorMessageForDeveloper = '';
        /** Вкл/выкл журналирования хода работы в консоль
         * @private
         * @type {boolean} */
        this._enableLog = false;
    }

    /**
     * @summary Configure class instance.
     * @description Configure class instance.
     * config (optional) {object} config object with properties:
     * - callback (optional) callback function (type {Function})
     * - enableLog (optional) enable logging to console: true/false (type {boolean})
     * - activateCondition (optional) css detection: a false condition that becomes true
     *   when external CSS rules are loaded and applied to DOM (type {string}).
     * - datasetToActivate (optional) a string array with dataset's names in attributes of resources
     *   that must be activated after activateCondition becomes true, example: ['data-src', 'data-href'] (type {Array.<String>}).
     * - urlsSource url's sources: root node for url extraction or array with url's strings,
     *   default - root node: document (type {Array<string>|Document|HTMLElement})
     *
     * If any of the settings wasn't configured, default values/actions will be applied:
     * - no actions after caching and applying (without config.callback)
     * - logging to console disabled (without config.enableLog)
     * - resources will be activated after downloading all files except tags containing dataset-attributes 'data-cache'
     *   (without config.activateCondition and/or config.datasetToActivate)
     * - getting urls by extracting them from tags containing dataset-attributes 'data-...' in the entire document
     *   (without config.urlsSource)
     *
     * activateCondition and datasetToActivate must be assigned to activate resources immediately
       after applying an external set of CSS rules, before the end of loading all resources.
     *
     * For example, it may be necessary to apply the cached background picture
       of an element while the process of loading other resources is still ongoing,
       but the external css class and preparation for CSS animation must be applied
       to the element before its background picture is displayed.
     * @param {object} [config] config object with properties
     * @param {Function} [config.callback] callback function
     * @param {boolean} [config.enableLog] enable logging to console: true/false
     * @param {string} [config.activateCondition] detection: a false condition that becomes true when external CSS rules
     *        are applied to DOM (applied after loading and activation). See explanation in method description and examples.
     * @param {Array.<String>} [config.datasetToActivate] string array with dataset's names in attributes of resources
              that must be activated after activateCondition becomes true, example: ['data-src', 'data-href']
     * @param {Array<string>|Document|HTMLElement} [config.urlsSource] url's sources: root node for url extraction
              or array with url's strings, default - document
     * @TODO progressBarHidingDelay: 500,
     * @TODO progressBarExtendedInfo: true, // слева от процентов текущий/ожидаемый размер загруженного, скорость, файл и т.д.
     * @TODO progressBarStyle: '.progressBarWrapper{...} .progressBar{...} .progressBarFill{...}',
     * @TODO getFileSizeMode: 'client-side',
     * @TODO retryCount: 3,
     * @TODO activateAfterCssRulesFirst: true, // приоритет загрузки
     * @example
     * // activateCondition example for an external css rules with following contents:
     * // < ./css/media.css >
     * .myClass {
     *    color: blue;
     *    height: 10vh;
     * }
     * // if element's color didn't assign before external css rule applied
     * condition = 'getComputedStyle(document.querySelector(".myClass")).color';
     * condition = 'getComputedStyle(document.querySelector(".myClass")).color == "blue"';
     * // if element's height didn't assign before external css rule applied
     * condition = 'document.querySelector(".myClass").offsetHeight';
     * condition = 'document.querySelector(".myClass").offsetHeight > 0';
     * condition = 'parseInt(getComputedStyle(document.querySelector(".myClass")).height)';
     * // wrong example, it is necessary to check the computed style applied to the element
     * // by getComputedStyle, not the immediate style of the element itself
     * condition = 'document.querySelector(".myClass").style.color';
     * // wrong example, it is necessary to check the computed style applied to the element
     * // by getComputedStyle or offsetHeight, not the immediate style of the element itself
     * condition = 'document.querySelector(".myClass").style.height > 0';
     * // wrong example, the condition value will be '0px' at the beginning,
     * // and casting it to boolean will yield true, so you need to do a string comparison
     * // === '0px' or convert to the number by parseInt
     * condition = 'getComputedStyle(document.querySelector(".myClass")).height';
     */
    config(config) {
        if (config.callback) {
            if (typeof config.callback !== 'function') throw Error('config.callback must be function');
            this._callback = config.callback;
        }

        if (config.enableLog) {
            if (typeof config.enableLog !== 'boolean') throw Error('config.enableLog must be boolean');
            this._enableLog = config.enableLog;
        }

        if (config.activateCondition) {
            if (!(typeof config.activateCondition === 'string'
                  || config.activateCondition instanceof String)) throw Error('config.activateCondition должно быть string');
            this._activateCondition = config.activateCondition;
        }

        if (config.datasetToActivate) {
            if (!( // type checking for an array with strings that begin with 'data-'
                Array.isArray(config.datasetToActivate)
                && config.datasetToActivate.every((datasetName) => (
                    (typeof datasetName === 'string' || datasetName instanceof String)
                    && datasetName.indexOf('data-') === 0)))) {
                throw Error('config.datasetToActivate must be an array with strings that begin with "data-"');
            }
            this._datasetToActivate = config.datasetToActivate.map((datasetName) => this.toCamelCase(datasetName));
        }

        if (config.urlsSource) {
            const urls = config.urlsSource;
            if (urls) {
                if (Array.isArray(urls)) {
                    if (urls.every((url) => typeof url === 'string' || url instanceof String)) this._urls = urls;
                } else if (urls instanceof Document || urls instanceof HTMLElement) this._rootNode = urls;
                if (!(this._urls || this._rootNode)) throw Error('urlsSource должно быть Array{String}|Document|HTMLElement');
            }
        }
    }

    /**
     * Запуск Preloader
     */
    start() {
        this._nodeList = this._urls ? false : this._getNodeList(); // если не указаны конкретные ссылки, получаем NodeList
        this._urls = this._urls || this._getDownloadLinks(); // если не указаны конкретные ссылки, получаем их из NodeList
        this._isDownloaded = new Array(this._urls.length).fill(false); // заполняем false весь массив
        this._isActivated = new Array(this._urls.length).fill(false); // заполняем false весь массив
        this._renderProgressBar(); // создаем спрятанный ProgressBar
        this._showProgressBar(); // показываем ProgressBar
        this._getFilesSize(this._urls) // получение от сервера размера каждого ресурса, указанного в массиве urls
        .then(this._downloadFileAll.bind(this)) // многопоточное скачивание ссылок
        .catch(this._onError.bind(this));
    }

    /**
     * Возвращает массив HTMLElement, дочерних к rootNode и имеющих dataset-атрибуты 'data-...'. Если rootNode не указан,
     * то источником ссылок будет весь документ
     * @param {Document|HTMLElement} rootNode корневой узел, в пределах которого производится извлечение url
     * @return {NodeList} NodeList массив HTMLElement, дочерних к rootNode и имеющих dataset-атрибуты 'data-...'
     * @private
     */
    _getNodeList(rootNode = this._rootNode || document) {
        this.log('get NodeList');
        // noinspection JSValidateTypes
        return Array.from(rootNode.querySelectorAll('[data-cache], [data-href], [data-src], [data-style-background-image]'));
    }

    /**
     * Возвращает массив url, которые надо загрузить,
     * берутся из значений dataset-атрибутов 'data-...' всех элементов массива
     * @param {NodeList} nodeList массив HTMLElement, имеющих dataset-атрибуты 'data-...'
     * @return {Array<String>} строковый массив имен файлов с путями (url), которые надо загрузить
     * @private
     */
    _getDownloadLinks(nodeList = this._nodeList) {
        this.log('get download links');
        // noinspection JSUnresolvedFunction
        return nodeList.map((htmlElement) => htmlElement.dataset.cache
            || htmlElement.dataset.href
            || htmlElement.dataset.src
            || htmlElement.dataset.styleBackgroundImage);
    }

    /**
     * Получает размеры данных (ссылок/файлов), указанных в параметре, с помощью серверного скрипта 'getFilesSize.php'.
     * Множественные запросы формируются в один и получаеся соответственно один ответ (аналог JOIN в SQL),
     * что эффективнее множественных запросов с помощью fetch method: 'HEAD' => response.headers.get('content-length')
     * Отслеживает HTTP ошибки, проверяет ответ на соответствие формату JSON
     * @param {Array<String>} urls строковый массив ссылок
     * @private
     * @throws {Error} при HTTP ошибке, при ответе сервера в формате, отличном от JSON
     */
    async _getFilesSize(urls = this._urls) {
        this.log('get files size');
        if (urls.length < 1) { // если ссылок не найдено, заканчиваем работу
            this._callback();
            return;
        }
        await fetch(
            'getFilesSize.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;' },
                signal: this._abortSignal, // для отмены запроса
                body: JSON.stringify({ ...this._urls }), // преобразуем this._urls в формат json и записываем его в тело запроса
            },
        )
        .then((response) => this._checkResponse(response, response.json)) // проверка на HTTP ошибки, ошибки несоответствия формату JSON
        .then(this._checkFilesSize.bind(this)) // проверка на доступность ссылок/файлов
        .catch(this._onError.bind(this));
    }

    /**
     * Проверяет fetch-ответ от сервера на наличие HTTP ошибок.
     * Обрабатывает ошибку несоответствия формата ответа указанному методу работы с ним
     * @param {Response} response fetch-ответ от сервера
     * @param {Function} responseMethod метод, который будет выполнен и возвращен его Promise.
     * Поддержка только таких методов: получение читателя потока (response.body.getReader) и методы response (response.body, response.json etc.)
     * @returns {Promise} Promise
     * @private
     */
    _checkResponse(response, responseMethod) {
        if (response.ok) {
            try {
                return responseMethod.name === 'getReader' ? response.body.getReader() : responseMethod.bind(response)();
            } catch (error) {
                if (error.message.indexOf('JSON') !== -1) {
                    this._errorMessageForUser = ': получен непонятный ответ от сервера';
                    this._errorMessageForDeveloper = `response.json() failed after fetching ${response.url}`;
                }
                throw Error(error);
            }
        } else {
            if (response.status >= 400 && response.status < 500) { // Client error responses
                this._errorMessageForUser = ': серверу не понравился запрос';
                this._errorMessageForDeveloper = '_checkResponse() found client error: '
                    + `${response.status} ${response.statusText} when fetching ${response.url}`;
            }
            if (response.status >= 500 && response.status < 600) { // Server error responses
                this._errorMessageForUser = ': ошибка сервера или сервер не смог выполнить запрос';
                this._errorMessageForDeveloper = '_checkResponse() found client error: '
                    + `${response.status} ${response.statusText} when fetching ${response.url}`;
            }
            throw Error();
        }
    }

    /**
     * Проверка после получения размера данных, их обработка и запуск загрузки всех ссылок
     * @param {JSON} json числовой массив размеров данных в формате JSON
     * @private
     * @throws {Error} если сервер не смог определить размер хоть одной ссылки/файла (отсутствие файла)
     */
    _checkFilesSize(json) {
        this.log('check files size');
        this._targetBytes = Object.values(JSON.parse(JSON.stringify(json)));
        for (let index = 0; index < this._urls.length; index++) {
            if (!(typeof this._targetBytes[index] === 'number' && Number.isFinite(this._targetBytes[index]))) {
                this._errorMessageForUser = ': ссылка '
                    + `'${document.location.href.match('(.*/).*')[0] + this._urls[index]}' недоступна`;
                this._errorMessageForDeveloper = `link "${this._urls[index]}" not found when checking in _onGetFilesSize()`;
                throw Error();
            }
        }
        this._totalBytes = this._targetBytes.reduce((sum, value) => sum + value);
        this._startTime = performance.now();
    }

    /**
     * Асинхронная загрузка всех ресурсов
     * @private
     * @see _onDownloadFile
     */
    _downloadFileAll() {
        for (let index = 0; index < this._urls.length; index++) {
            this._downloadFile(index)
            .then(() => this._onDownloadFile(index))
            .catch(this._onError.bind(this));
        }
    }

    /**
     * Асинхронная загрузка ресурса
     * @param {number} index индекс в массиве ссылок
     * @returns {Promise<void>}
     * @private
     */
    async _downloadFile(index) {
        const urls = this._urls;
        this.log(`downloading ${index + 1} of ${urls.length} links: ${urls[index]}`);
        const response = await fetch(urls[index], { signal: this._abortSignal });
        const reader = this._checkResponse(response, response.body.getReader);
        let receivedBytes = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) return;
            receivedBytes += value.length;
            this._currentBytes[index] = receivedBytes;
            this._updateProgressBar(index, receivedBytes);
            // детальный лог фрагментной загрузки
            // this.log(`${urls[index]} : downloaded ${receivedBytes} of ${this._targetBytes[index]} bytes`);
        }
    }

    /**
     * Действия, совершаемые после загрузки(кеширования) ресурса:
     * 1. Если установлен config.activateCondition, то активируем внешний набор CSS правил
     *    и активируем сразу после применения к DOM этих правил уже закешированные другие ресурсы
     * 2. Если все ресурсы уже загружены, активировать их
     * @param {number} index индекс в массиве ссылок
     * @private
     */
    _onDownloadFile(index) {
        this.log(`${this._urls[index]} caching complete`);
        this._isDownloaded[index] = true;

        if (this._nodeList) {
            const htmlElement = this._nodeList[index];

            // если установлено условие для активации ресурсов после применения внешнего набора CSS правил config.activateCondition
            if (this._activateCondition) {
                // если ресурс - внешний набор стилей
                if (htmlElement.rel === 'stylesheet') {
                    this._isActivated[index] = true;
                    this.log(`activate external CSS rules in ${this._urls[index]}`);

                    // перед активацией нужен обработчик onload, т.к. кешированный внешний набор CSS правил подгружается из кеша за ненулевое время
                    htmlElement.onload = () => {
                        // ожидание, когда броузер применит к DOM набор CSS правил,
                        // а конкретнее - проверка каждый animationFrame истинности условия config.activateCondition
                        this._waitingToApplyCssRules()
                        .then(() => this._onCssRulesApplied(index)) // стили применены к DOM
                        .then(() => this._activateDataSetResourceAll(true)); // активируем ресурсы, типы которых указаны в config.datasetToActivate
                    };
                    delete htmlElement.dataset.href;
                    htmlElement.setAttribute('href', this._urls[index]); // активировать внешний набор CSS правил
                } else if (this._cssRulesApplied) { // активировать ресурс, если внешний набор CSS правил уже применен
                    this._activateDataSetResourceAll(true);
                }
            }
        }
        // если все уже загружено
        if (this._isDownloaded.indexOf(false) === -1) {
            this.log(`download to cache complete: total ${Math.round(this._totalBytes / 1000)} KB in ${this._urls.length} files`);
            // giving a little time to applying css ruleset in case of all resources are in cache after previous page load
            setTimeout(() => {
                if (this._nodeList) this._activateDataSetResourceAll();
                this.log('caching & activating resources complete');
            },
            100);
            // даем время на доползания дорожки прогрес-бара до 100% (оно идет с небольшой задержкой из-за css-анимации)
            setTimeout(this._updateProgressBar.bind(this), 500);
            // даем время на анимацию исчезновения ProgressBar за верхний край
            setTimeout(this._callback, 1000);
        }
    }

    /**
     * Обработчик ошибок. Отменяет все запросы fetch.
     * Для пользователя на экран выводит 'Ошибка загрузки данных: ' + `this._errorMessageForUser`.
     * Для разработчика выводит в консоль `this._errorMessageForDeveloper` + детали из самой ошибки
     * В конце генерирует исключение Error
     * @param {Error} error экземпляр Error
     * @private
     * @throws {Error}
     */
    _onError(error) {
        this._abortController.abort(); // отменяем все запросы fetch
        const errorMessage = 'Ошибка загрузки данных';
        let element = document.querySelector('.progressBarInfo');
        // этот блок условия генерирует user-friendly экранное сообщение об ошибке
        // Проверяем, существует ли элемент. Если не существует, значит он был уже удален и сообщение об ошибке уже выведено
        if (element) {
            element.parentNode.removeChild(element); // чтобы не мешал при длинном тексте ошибки
            element = document.querySelector('.progressBarFill');
            element.style.width = '100%';
            element.classList.add('progressBarErrorMessage');
            if (!this._errorMessageForUser) { // если ошибка еще не дифференцирована, пробуем определить сетевую ошибку
                setTimeout(() => {
                    // если броузер перешел в режим offline
                    if (!navigator.onLine) {
                        this.log('web browser went into offline');
                        this._errorMessageForUser = ': отсутствует сетевое подключение';
                        // chrome: 'Failed to fetch', firefox: 'NetworkError when attempting to fetch resource'
                        // вангуем для остальных и будущих броузеров, добавляя:
                        // unsuccess, prohibit, forbid, ban, denied, deny + internet, access, connect, load
                        // если нижеуказанный regex возвращает true, значит при текущем сетевом подключении нет доступа в Интернет
                    } else if (error.message.match(
                        /(?=.*(error|fail|unsuccess|prohibit|forbid|ban|denied|deny))(?=.*(fetch|network|internet|access|connect|load))/i,
                    )) {
                        this.log('network connection does not have access to the Internet');
                        this._errorMessageForUser = ': сетевое подключение не имеет доступа к сети Интернет';
                    }
                    element.innerHTML = errorMessage + this._errorMessageForUser;
                },
                500);
            }
        }
        throw Error(`${this._errorMessageForDeveloper}\n${error.message}\n${error.stack.replace('/<@', ' in ')}`);
    }

    /**
     * Прячет ProgressBar за верхний край с анимацией (когда всё уже скачано)
     * @private
     */
    _hideProgressBar() {
        this.progressBar.style.top = '-31px';
    }

    /**
     * Обновляет данные в ProgressBar.
     * Когда всё уже скачано, метод вызывается без параметров, устанавливается прогресс в 100% и прячется с анимацией за верхнюю границу
     * @param {number} [index] индекс в массиве ссылок
     * @param {number} [receivedLength] полученный размер chunk
     * @private
     */
    _updateProgressBar(index, receivedLength) {
        const downloadedBytes = this._currentBytes.reduce((sum, value) => sum + value);
        const percents = 100 * downloadedBytes / this._totalBytes;
        const speed = Math.round(downloadedBytes / (performance.now() - this._startTime));

        const downloadedBytesMessage = `downloaded ${Math.round(downloadedBytes / 1000)} of ${Math.round(this._totalBytes / 1000)} KB<br/>`;
        const speedMessage = `at speed ${speed} KB/s`;
        const fileMessage = (index === undefined ? '' : `<br/>${this._urls[index]} : ${Math.round(receivedLength / 1000)} of ${Math.round(this._targetBytes[index] / 1000)} KB`);
        requestAnimationFrame(() => {
            const progress = document.querySelector('.progressBarFill');
            // border-radius создает артефакты рендеринга в firefox. Подготовка: класс выключен
            // progress.classList.toggle('reDrawRenderingArtifacts');
            progress.style.width = `${percents}%`;
            document.querySelector('.progressBarText').innerHTML = downloadedBytesMessage + speedMessage + fileMessage;
            document.querySelector('.progressBarPercent').innerHTML = `${Math.round(percents)}%`;
            // border-radius создает артефакты рендеринга в firefox. Перерисовка: класс включен
            // progress.classList.toggle('reDrawRenderingArtifacts');
        });
        if (index === undefined) this._hideProgressBar(); // всё уже скачано
    }

    /**
     * Активация всех кешированных ресурсов, ссылки на которые были в dataset-атрибутах HTMLElement
     * Ресурсы в dataset-атрибуте 'data-cache' не активируются by design.
     * Алгоритм активации:
     * data-src=url => src=url
     * data-href=url => href=url
     * data-style-background-image=url => htmlElement.style.backgroundImage = url
     * После активации dataset-атрибут удаляется
     * @param {boolean} [activateAfterCssRules] активация сразу после применения внешнего набора правил CSS
     * @private
     * @see _activateDataSetResource
     */
    _activateDataSetResourceAll(activateAfterCssRules = false) {
        for (let index = 0; index < this._urls.length; index++) {
            if (this._isDownloaded[index]) this._activateDataSetResource(index, activateAfterCssRules);
        }
    }

    /**
     * Активация кешированного ресурса, ссылка на который была в dataset-атрибуте HTMLElement
     * Ресурс в dataset-атрибуте 'data-cache' не активируется by design.
     * Алгоритм активации:
     * data-src=url => src=url
     * data-href=url => href=url
     * data-style-background-image=url => htmlElement.style.backgroundImage = url
     * После активации dataset-атрибут удаляется
     * @param {number} index индекс в массиве ссылок
     * @param {boolean} activateAfterCssRules активация сразу после применения внешнего набора правил CSS
     * @private
     */
    _activateDataSetResource(index, activateAfterCssRules) {
        const htmlElement = this._nodeList[index];
        Object.keys(htmlElement.dataset)
        .forEach((datasetName) => {
            // если установлено условие в и активационный список содержит datasetName
            if (!this._isActivated[index] && activateAfterCssRules ? this._datasetToActivate.includes(datasetName) : true) {
                this._isActivated[index] = true;
                if (datasetName === 'styleBackgroundImage') {
                    htmlElement.style.backgroundImage = `url(${this._urls[index]})`;
                    delete htmlElement.dataset[datasetName];
                    this.log(`background '${this._urls[index]}' activated`);
                } else if (datasetName !== 'cache') { // 'data-cache'/'cache' не активируется by design
                    htmlElement.setAttribute(datasetName.replace('data-', ''), this._urls[index]);
                    delete htmlElement.dataset[datasetName];
                    this.log(`resource '${this._urls[index]}' activated`);
                }
            }
        });
    }

    /**
     * Создает панель/полоску выполнения и ее стиль, и вставляет в документ.
     * Создает быстрый доступ к созданному HTMLElement через this.progressBar
     * @private
     */
    _renderProgressBar() {
        // Собственное автономное, встроенное стилевое оформление необходимо, поскольку внешние стили могут быть еще не подгружены
        const style = document.createElement('style');
        style.innerHTML = `
            .progressBarWrapper {
                font-family: sans-serif;
                font-weight: bold;
                width: 100%;
                position: absolute;
                visibility: hidden;
                left: 0;
                top: -31px;
                z-index: 999;
                transition: top 0.5s linear;
            }
        
            .progressBar {
                background-color: #e0e0e0;
                padding: 3px;
                box-shadow: inset 0 0 8px rgba(0, 0, 0, .3);
            }
        
            .progressBarFill {
                width: 0;
                height: 25px;
                background-color: #4293c7;
                border-radius: 3px;  /* создает артефакты рендеринга в firefox, fix: каждую прорисовку OFF...code...ON класс '.reDrawRenderingArtifacts' */
                transition: width 900ms linear;
            }
        
            .reDrawRenderingArtifacts {
                transform: translateZ(0);
            }
        
            .progressBarInfo {
                width: 100%;
                position: absolute;
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: center;
                align-self: center;
                z-index: 999;
                top: 4px;
                left: 5px;
            }
        
            .progressBarText {
                color: #222845;
                line-height: 0.9;
                width: 47%;
                height: 25px;
                font-size: 9px;
            }        
        
            .progressBarPercent {
                color: white;
                text-shadow: 0 0 3px #222845, 0 0 3px #222845;
                letter-spacing: 1px;
                font-size: 18px;
            }
        
            .progressBarErrorMessage {
                color: white;
                background-color: red;
                height: auto;
                text-shadow: 0 0 3px #222845, 0 0 3px #222845;
                letter-spacing: 1px;
                font-size: 18px;
                text-align: center;
            }`;
        document.body.appendChild(style);
        const progressBarWrapper = document.createElement('div');
        this.progressBar = progressBarWrapper; // для удобной доступности из всех методов
        progressBarWrapper.className = 'progressBarWrapper';
        progressBarWrapper.classList.toggle('reDrawRenderingArtifacts');
        progressBarWrapper.innerHTML = `
            <div class = 'progressBar'>
                <div class = 'progressBarFill' style = 'width: 0'></div>
            </div>
            <div class = 'progressBarInfo'>
                <span class = 'progressBarText'></span>
                <span class = 'progressBarPercent'>Downloading...</span>
            </div>`;
        document.body.appendChild(progressBarWrapper);
        // форсируем применение стилей, т.к. дальше по этим стилям будет анимация
        // eslint-disable-next-line no-unused-expressions
        getComputedStyle(progressBarWrapper).top;
    }

    /**
     * Показывает ProgressBar, с CSS-анимацией его появления сверху
     * @private
     */
    _showProgressBar() {
        this.progressBar.style.visibility = 'visible';
        this.progressBar.style.top = '0';
    }

    /**
     * Ожидание применения внешнего набора правил CSS и активация ресурсов после этого
     * @private
     */
    async _waitingToApplyCssRules() {
        // eslint-disable-next-line no-eval
        if (!eval(this._activateCondition)) requestAnimationFrame(this._waitingToApplyCssRules.bind(this));
    }

    /**
     * Устанавливает флаг успешного применения внешнего набора CSS правил
     * @param {number} CssFileIndex индекс ссылки на примененный внешний набор CSS правил
     * @private
     */
    _onCssRulesApplied(CssFileIndex) {
        this.log(`external CSS rules in '${this._urls[CssFileIndex]}' were applied to DOM`);
        this._cssRulesApplied = true;
    }

    /**
     * Выводит в консоль сообщения, если выставлен флаг this._enableLog
     * @param {string} message сообщение, выводимое в консоль
     * @private
     * @see _enableLog
     */
    log(message) {
        // eslint-disable-next-line no-console
        if (this._enableLog) console.log(`${Math.round(performance.now())} Preloader: ${message}`);
    }

    /* eslint-disable camelcase */
    // noinspection JSMethodCanBeStatic
    /**
     * Преобразование snake-case в camelCase, с удалением ведущей 'data-'.
     * Поддержка варианта kebab\lisp\dash-case
     * @param {string} snake_case_string строка для преобразования
     * @returns {string} camelCaseString преобразованная строка
     * @example
     *      'snake_case_string' => 'snakeCaseString'
     *      'snake-case-string' => 'snakeCaseString'
     * 'data-snake_case_string' => 'snakeCaseString'
     * 'data-snake-case-string' => 'snakeCaseString'
     */
    toCamelCase(snake_case_string) {
        if (!(typeof snake_case_string === 'string' || snake_case_string instanceof String)) {
            throw Error('snake_case_string должна быть string');
        }
        return snake_case_string.replace(/[-|_]([\S])|(data-)/g, (match, group1) => (group1 ? group1.toUpperCase() : ''));
    }
};
