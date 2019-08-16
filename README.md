# www-smart-preloader
Shows a loader when loads resources (images, scripts, css, etc.) into the browser cache. If necessary, it is possible to activate cached resources immediately or when all resources hit the cache. Loader template: download bar with detailed information about the speed, amount of downloaded data, current file.

# Description:
Многопоточный предзагрузчик ресурсов, показывает полоску процесса предзагрузки в реальном времени.
Кеширует ресурсы с опциональной последующей активацией и вызовом callback.
Расположение ресурсов поддерживаются в соответствии с политикой same-origin, реализация CORS находится в стадии разработки.

Поиск ссылок на ресурсы для предзагрузки производится во всем документе или в пределах указанного HTMLElement.
Возможна обработка готового массива ссылок, в таком случае активации содержимого не происходит, только кеширование.

Для указания того, что ресурс url нужно кешировать, используется dataset-атрибут: data-cache=url
Для указания того, что ресурс url нужно активировать после кеширования, необходимо переименовать содержащий url атрибут в его соответствующий dataset-атрибут:
1. src=url > data-src=url, например, в теге <img src=url> => <img data-src=url> или <script src=url> => <script data-src=url>
2. href=url > data-href=url, например, в теге <link href=url rel='stylesheet'> => <link data-href=url rel='stylesheet'>
3. style='background-image: URL("url")' > data-style-background-image=url

Теги с dataset-атрибутами не должны иметь соответствующие атрибуты src, href etc., поскольку это обессмыслит кеширование.
Активация ресурсов происходит автоматически из dataset-атрибутов:
1. data-src=url > src=url
2. data-href=url > href=url
3. data-style-background-image=url > htmlElement.style.backgroundImage = URL('url')
После кеширования и активации ресурсов происходит удаление dataset-атрибутов, чем можно воспользоваться, например, для создания CSS-анимации плавного проявления фона после его активации:
<pre>
div {
     opacity: 1;
     transition: background-color 1s}
div[data-src] {
     opacity: 0}</pre>
     
# Installation:
1. Скопировать файл getFilesSize.php в корневую папку (изменить путь к скрипту можно в методе _getFilesSize). Это скрипт php, который принимает массив ссылок на файлы и возвращает массив их размеров.
2. Скопировать файл Preloader.js в корневую папку
3. Можно, но необязательно копировать шаблон index.html

# Usage:
 1. Добавить в головной файл тег <script src='Preloader.js'></script>
 2. Добавить в головной файл теги, ресурсы которых надо кешировать
 3. Изменить атрибуты в тегах п.2:
    src=url > data-src=url, href=url > data-href=url, style='background-image: URL("url")' > data-style-background-image=url
 4. Создать экземпляр Preloader без параметров или с указанием следующих необязательных параметров:
 4.1. callback (тип function).
 4.2. urlsSource (тип Array<string>|HTMLElement|Document) - источник ссылок: строковый массив ссылок или корневой узел извлекаемых url, а если urlsSource не указан - то url извлекается из всего документа (объект document - начиная с <html>).
 5. Указать callback с помощью метода onSuccess, если он не был указан в п.4.1.
 6. Опция: включение активации кешированных ресурсов сразу после применения внешнего набора правил CSS через метод activateAfterCssRules
 7. Запуск процесса кеширования с помощью метода start().
 
 Т.к. Preloader использует DOM, то вызов start() должен быть не ранее события DOMContentLoaded
 Расположение ресурсов поддерживаются в соответствии с политикой same-origin, поддержка CORS добавлена в TODO-список

# Examples:
// Минифицированная реализация.
// Кеширование и активация ресурсов из всего документа.
// Указание callback во время создания экземпляра класса
(new Preloader(callback)).start();

// кеширование массива указанных ссылок
let preloader = new Preloader(
     callback,
     ['./img/b.jpg', 'media.css', 'app.js']);
     
// кеширование и активация ссылок, найденных в пределах елемента с селектором '.gallery',
// указание callback после создания экземпляра класса,
// загрузка фоновых изображений сразу после применения внешнего набора правил CSS
// с указанием истинного условия (внешний css содержит: body{color:red})
let preloader = new Preloader(
     false,
     document.querySelector('.gallery') );
preloader.onSuccess = () => alert('preload complete');
preloader.activateAfterCssRules(
     'getComputedStyle(document.body).color === "red"',
     ['data-style-background-image', 'data-src', 'data-href']);

# TODO:
- реализовать i18n в пределах t9n
- перевести всё на английский
- реализовать retry при сетевой ошибке во время загрузки
- детальнее провести дифференцирование ошибок при загрузке ресурса
- учесть случай, когда условие проверки CSS никогда не станет истинным (условие проверки применения к DOM внешнего набора CSS правил)
- добавить front-end альтернативу back-end реализации определения размеров файлов
- добавить дифференцирование ошибок proxy
- добавить поддержку CORS для использования нелокальных ресурсов
- добавить опционально режим загрузки, при котором ресурсы, указанные в activateAfterCssRulesCondition, будут загружаться первыми
- шаблонизировать внешний вид лоадера loader (хочу сделать шаблон в виде наполняющейся чашки кофе с анимированным исходящим паром над ней)
- сделать удобную детальную настройку в виде:
preloader.config = {
    onSuccessCallback: callback,
    enableLog: false,
    progressBarHidingDelay: 500,
    progressBarExtendedInfo: true, // слева от процентов текущий/ожидаемый размер загруженного, скорость, файл и т.д.
    progressBarStyle: '.progressBarWrapper{...} .progressBar{...} .progressBarFill{...}',
    getFileSizeMode: 'client-side',
    retryCount: 3,
    activateAfterCssRulesCondition: condition, // условие для проверки применения внешнего CSS
    activateAfterCssRulesResources: datasetList, // типы dataset для активации
    activateAfterCssRulesFirst: true, // приоритет загрузки
}

# Contributing:
Thanks for taking the time to join our community and start contributing!
Please remember to read and observe the Code of Conduct.
This project accepts contribution via github pull requests. This document outlines the process to help get your contribution accepted. Please also read the Kubernetes contributor guide which provides detailed instructions on how to get your ideas and bug fixes seen and accepted.
If you have any problem with the package or any suggestions, please file an issue.
If you have any suggestions? contact me.
I'd love to accept your patches and make this project beter.

# Credits:
Nickieros

# License:
MIT
