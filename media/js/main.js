window.RadicalInstaller = {
    api: '',
    url: 'index.php?option=com_ajax&plugin=radicalinstaller&group=installer&format=json',
    assets: '/media/plg_installer_radicalinstaller/',
    container: null, // контейнер HTML для установщика
    form: null, // форма HTML установки Joomla
    category_id: 0, // текущая активная категория расширений
    manage: null,
    categories: null, // список категорий расширений в тулбар
    check_main_after_install: false, // флаг для того чтобы смотреть после установки основного расширения
    button_active: null, // активная кнопка в тулбаре
    depends_wait: true, // флаг для ожидания загрузки зависимостей
    project_install: [], // список установленных расширений
    project_delete: [], // список удаляемых расширений
    buy_projects: [], // список купленных расширений
    template_sidebar: {},

    /**
     * Запуск установщика
     */
    init: function () {
        let self = this;
        self.container = document.querySelector('#radicalinstaller-container');
        self.form = document.querySelector('#adminForm');
        self.api = RadicalInstallerConfig.api;
        self.template_sidebar = {
            key: {
                header: 'Что такое ключ',
                content: 'Для того чтобы распознать, что это Вы обращаетесь в наш сервис нам требуется идентификация. Свой ключ Вы можете получить на сайте <a href="https://radicalmart.ru" target="_blank">radicalmart.ru</a>'
            },
            faq: {
                header: 'FAQ',
                content: '<ul>' +
                    '<li><h4>Как купить расширение?</h4><p>На сайте <a href="https://radicalmart.ru" target="_blank">radicalmart.ru</a>.</p></li>' +
                    '<li><h4>Где поменять ключ?</h4><p>В настройках плагина установщика.</p></li>' +
                    '<li><h4>Как удалить расширение?</h4><p>Нажмите на кнопку "Установлено" из раздела "Управление".</p></li>' +
                    '<li><h4>Могу ли я добавить свое расширение?</h4><p>Да. Перейдите по кнопке "Добавить расширение" из поддержки.</p></li>' +
                    '</ul>'
            },
            support: {
                header: 'Поддержка',
                content: '<div class="radicalinstaller-flex radicalinstaller-flex-space">' +
                    '<a href="https://radicalmart.ru/support" class="btn" target="_blank">' + RadicalInstallerLangs.button_support_site + '</a>' +
                    '<a href="mailto:support@radicalmart.ru" class="btn">' + RadicalInstallerLangs.button_support_email + '</a>' +
                    '<a href="https://t.me/radicalmart" class="btn" target="_blank">' + RadicalInstallerLangs.button_support_telegram + '</a>' +
                    '<a href="https://radicalmart.ru/add" class="btn" target="_blank">' + RadicalInstallerLangs.button_support_add + '</a>' +
                    '</div>'
            }
        };

        // если нет ключа, то запускаем показ формы ввода ключа
        if (RadicalInstallerConfig.key === '') {
            self.showFormKey();
            return;
        }

        // если ключ есть, то запускаем проверку установки одного из основного расширения
        self.checkMainExtension();
    },


    /**
     * Смена категории расширений
     *
     * @param id
     */
    changeCategory: function (id) {
        let self = this,
            grid = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-grid'}),
            pagination = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-pagination'});

        // очищаем весь основной контейнер и вставляем в него базовые элементы для каталога
        self.renderPage({
            header: 'Каталог расширений',
            content: [grid.build(), pagination.build()],
            sidebar: [
                {header: 'Управление', content: self.manage.build()},
                {header: 'Категории', content: self.categories.build()},
                {template: 'support'},
                {template: 'faq'}
            ]
        })

        // запускаем показ экрана загрузки
        self.loaderInit();
        self.loaderShow();

        if (RadicalInstallerConfig.key !== '') {
            let url = self.url + '&method=buyprojects';

            RadicalInstallerUtils.ajaxGet(url).done( function (json) {
                self.buy_projects = json.items;
            });
        }

        // load_page замыкание, которое потом вызываем внутри себя при клике на пагинацию
        let load_page = function (page, limit) {
            let url = self.url + '&method=projects&category_id=' + id;

            if (page !== null) {
                url += '&page=' + page;
            }

            if (limit !== null) {
                url += 'l&imit=' + limit;
            }

            RadicalInstallerUtils.ajaxGet(url)
            .done( function (json) {
                json = JSON.parse(json.data);
                let cards = json.items;

                for (let i=0;i<cards.length;i++) {
                    self.container.querySelector('.radicalinstaller-grid').append(self.renderCatalogGrid(cards[i]).build());
                }

                self.setColors();
                self.checkInstall();
                self.checkUpdates();
                self.loaderHide();

                self.container.querySelector('.radicalinstaller-pagination').innerHTML = '';
                if (json.pagination !== undefined) {
                    let last_page = parseInt(json.pagination.pagesTotal),
                        page_limit = parseInt(json.pagination.limit),
                        current_page = parseInt(json.pagination.pagesCurrent);

                    if (last_page > current_page) {
                        let pagination_button = RadicalInstallerUtils.createElement('button', {
                            'class': 'btn btn-large radicalinstaller-pagination_more', 'events': [
                                [
                                    'click',
                                    function (ev) {
                                        load_page(current_page + 1, page_limit);
                                        ev.preventDefault();
                                        return true;
                                    }
                                ]
                            ]
                        }, RadicalInstallerLangs.button_load_more);

                        self.container.querySelector('.radicalinstaller-pagination').append(pagination_button.build());
                    }

                }

            });
        }

        self.category_id = id;
        load_page();

        // отключаем всем кнопкам классы активности
        let buttons_all = document.querySelectorAll('.radicalinstaller-categories button');
        for (let i = 0; i < buttons_all.length; i++) {
            buttons_all[i].classList.remove('btn-active');
        }

        // находим активную кнопку и ей назначаем класс активности
        let button_active = document.querySelector('button[data-type="category-' + self.category_id + '"]');
        if (button_active !== null && button_active !== undefined) {
            button_active.classList.add('btn-active');
        }
    },


    /**
     * Запуск показа каталога
     */
    showCatalog: function () {
        let self = this;
        this.checkUpdates();

        self.categories = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-categories radicalinstaller-flex radicalinstaller-flex-space'});
        self.manage = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-flex radicalinstaller-flex-space'});

        self.manage.add('button', {
            'class': 'btn btn-check-update', 'data-type': 'update', 'events': [
                [
                    'click',
                    function (ev) {
                        self.showUpdates();
                        ev.preventDefault();
                    }
                ]
            ]
        }, '<span class="empty">0</span> ' + RadicalInstallerLangs.button_update);

        self.manage.add('button', {
            'class': 'btn', 'data-type': 'installed', 'events': [
                [
                    'click',
                    function (ev) {
                        self.showInstalled();
                        ev.preventDefault();
                    }
                ]
            ]
        }, RadicalInstallerLangs.button_installed);

        self.categories.add('button', {
            'class': 'btn btn-change-category', 'data-type': 'category-0', 'events': [
                [
                    'click',
                    function (ev) {
                        self.changeCategory(0);
                        ev.preventDefault();
                    }
                ]
            ]
        }, RadicalInstallerLangs.button_extensions_all);

        self.categories.add('button', {
            'class': 'btn btn-change-category', 'data-type': 'category--1', 'events': [
                [
                    'click',
                    function (ev) {
                        self.changeCategory(-1);
                        ev.preventDefault();
                    }
                ]
            ]
        }, RadicalInstallerLangs.button_extensions_my);

        // здесь замыкание не обязательно, но оставил по аналогии с загрузкой каталога
        // получаем с API список доступных категорий для каталога
        let load_categories = function () {
            let url = self.url + '&method=categories';

            RadicalInstallerUtils.ajaxGet(url)
            .done( function (json) {
                json = JSON.parse(json.data);
                let categories_items = json.items;
                for (let i = 0; i < categories_items.length; i++) {
                    self.categories.add('button', {
                        'class': 'btn btn-change-category',
                        'data-type': 'category-' + categories_items[i].id,
                        'events': [
                            [
                                'click',
                                function (ev) {
                                    self.changeCategory(categories_items[i].id);
                                    ev.preventDefault();
                                }
                            ]
                        ]
                    }, categories_items[i].title);
                }

                let search_categories = self.container.querySelector('.radicalinstaller-categories');

                if (search_categories !== null && search_categories !== undefined) {
                    let container = search_categories.parentElement;
                    search_categories.remove();
                    container.append(self.categories.build());
                }
            });
        }

        self.changeCategory(self.category_id);
        load_categories();
    },


    /**
     * Показ формы ввода ключа
     */
    showFormKey: function () {
        let self = this,
            page = RadicalInstallerUtils.createElement('div');
            page = page
                .addChild('div')
                    .addChild('div', {'class': 'radicalinstaller-width-1-1 radicalinstaller-margin-bottom'})
                        .addChild('form', {
                            'class': 'radicalinstaller-width-2-3 form-horizontal',
                            'events': [
                                [
                                    'submit',
                                    function (event) {
                                        event.preventDefault();


                                        let key_value = event.target.querySelector('[name=key]').value;

                                        if(key_value.length < 30)
                                        {
                                            RadicalInstallerUtils.createAlert(RadicalInstallerLangs.error_key, 'danger',5000);
                                            return;
                                        }

                                        // отправить аякс на сохранение ключа
                                        RadicalInstallerUtils.ajaxPost(self.url + '&method=saveKey', {key: key_value})
                                            .done(function (response) {
                                                self.checkMainExtension();
                                                RadicalInstallerConfig.key = key_value; // можем присвоить ключ, так как сервер примет только проверенный ключ
                                            })
                                            .fail(function (xhr) {
                                                let response = JSON.parse(xhr.responseText);

                                                if(response !== null && response.data[0] !== undefined) {
                                                    RadicalInstallerUtils.createAlert(response.data[0], 'danger',5000);
                                                    return;
                                                }

                                                RadicalInstallerUtils.createAlert(RadicalInstallerLangs.error_service, 'danger',5000);
                                            });

                                        return false;
                                    }
                                ]
                            ]
                        })
                            .addChild('div', {'class': 'radicalinstaller-card radicalinstaller-background-muted radicalinstaller-padding-large'})
                                .addChild('div', {'class': 'control-group control-group-no-label control-group-large'})
                                    .addChild('div', {'class': 'controls'})
                                        .add('input', {'class': 'span12', 'type': 'text', 'placeholder': 'Введите здесь ваш ключ', 'name': 'key'})
                                        .getParent()
                                    .getParent()
                                .addChild('div', {'class': 'control-group control-group-no-label control-group-large'})
                                    .addChild('div', {'class': 'controls'})
                                        .add('button', {'class': 'btn btn-primary btn-large', 'type': 'submit'}, 'Отправить')
                                        .getParent()
                                    .getParent()
                                .getParent()
                            .getParent()
                        .getParent()
                .addChild('div', {'class': 'radicalinstaller-width-1-1'})
                    .addChild('div', {'class': 'radicalinstaller-width-2-3'})
                        .addChild('div', {'class': 'alert alert-info'})
                            .add('h3', {'class': 'alert-alert'}, RadicalInstallerLangs.text_header_scan_extension)
                            .add('div', {'class': 'alert-message'}, RadicalInstallerLangs.text_scan_extension)
                            .getParent()
                        .getParent()
                    .getParent();

        self.renderPage({
            header: 'Установка расширений из <a href="https://radicalmart.ru" target="_blank">radicalmart.ru</a>',
            description: 'Для того чтобы продолжить, Вам необходимо ввести ключ обращения к сервису.',
            content: page.build(),
            sidebar: [
                {template: 'key'},
                {template: 'support'},
            ]
        })
    },


    /**
     * Показывает подробную карточку расширения
     *
     * @param id
     */
    showProject: function (id) {
        let self = this,
            header_loader = RadicalInstallerUtils.createElement('div'),
            body_loader = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-project-page'});

        body_loader = body_loader
            .addChild('div', {'class': 'radicalinstaller-flex radicalinstaller-flex-center'})
                .add('img', {'src': self.assets + '/img/loader.svg'})
                .getParent();

        RadicalInstallerUtils.modal(header_loader.build(), body_loader.build());

        RadicalInstallerUtils.ajaxGet(self.url + '&method=project&project_id=' + id)
        .done(function (json) {
            let item = JSON.parse(json.data),
                header = RadicalInstallerUtils.createElement('div'),
                body = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-project-page'}),
                color = RadicalInstallerUtils.generateColorFromText(item.title),
                docs = '',
                support = '';

            // проверяем наличие поддержки у расширения
            if (
                item.urls.support !== undefined &&
                item.urls.support !== false &&
                item.urls.support !== ''
            ) {
                support = item.urls.support;
            }

            // проверяем наличии документации у расширения
            if (
                item.urls.documentation !== undefined &&
                item.urls.documentation !== false &&
                item.urls.documentation !== ''
            ) {
                docs = item.urls.documentation;
            }

            if (
                item.documentation !== undefined &&
                item.documentation !== false &&
                item.documentation !== ''
            ) {
                docs = self.api + item.documentation;
            }

            if (item.params !== undefined) {
                if (
                    item.params.attrs_color !== undefined &&
                    item.params.attrs_color !== ''
                ) {
                    color = item.params.attrs_color;
                }
            }

            // проверяем наличии галереи у расширения и генерируем DOM, если она есть
            if (item.gallery.length > 0) {
                header = header.addChild('div', {'class': 'radicalinstaller-project-page_gallery-images', 'data-active': 1})
                    .add('div', {
                        'class': 'radicalinstaller-project-page_gallery-images-background',
                        'style': 'background-color: ' + color
                    });
                for (let i = 0; i < item.gallery.length; i++) {
                    header = header.addChild('div', {
                        'class': 'radicalinstaller-project-page_gallery-images-element',
                        'style': i === 0 ? 'display:block' : 'display:none'
                    })
                        .add('img', {
                            'alt': item.gallery[i].text,
                            'src': self.api + '/' + item.gallery[i].src
                        })
                        .add('div', {'class': 'radicalinstaller-project-page_gallery-images-element_caption'}, item.gallery[i].text)
                        .getParent();
                }

                header = header.add('button', {
                    'class': 'radicalinstaller-project-page_gallery-images-prev', 'events': [
                        [
                            'click', function (ev) {
                                let i,
                                    slideshow = this.closest(".radicalinstaller-project-page_gallery-images"),
                                    slides = slideshow.querySelectorAll('.radicalinstaller-project-page_gallery-images-element'),
                                    active = parseInt(slideshow.getAttribute('data-active')) - 1;

                                if (active > slides.length) {
                                    active = 1;
                                }

                                if (active < 1) {
                                    active = slides.length;
                                }

                                for (i = 0; i < slides.length; i++) {
                                    slides[i].style.display = "none";
                                }

                                slides[active - 1].style.display = "block";
                                slideshow.setAttribute('data-active', active);
                            }
                        ]
                    ]
                }, '❮');

                header = header.add('button', {
                    'class': 'radicalinstaller-project-page_gallery-images-next', 'events': [
                        [
                            'click', function (ev) {
                                let i,
                                    slideshow = this.closest(".radicalinstaller-project-page_gallery-images"),
                                    slides = slideshow.querySelectorAll('.radicalinstaller-project-page_gallery-images-element'),
                                    active = parseInt(slideshow.getAttribute('data-active')) + 1;

                                if (active > slides.length) {
                                    active = 1;
                                }

                                if (active < 1) {
                                    active = slides.length;
                                }

                                for (i = 0; i < slides.length; i++) {
                                    slides[i].style.display = "none";
                                }

                                slides[active - 1].style.display = "block";
                                slideshow.setAttribute('data-active', active);
                            }
                        ]
                    ]
                }, '❯');
                header = header.getParent();
            } else {
                if (item.images !== undefined) {
                    header = header.addChild('div', {'class': 'radicalinstaller-project-page_gallery-images', 'data-active': 1})
                        .add('div', {
                            'class': 'radicalinstaller-project-page_gallery-images-background',
                            'style': 'background-color: ' + color
                        });
                    header = header.addChild('div', {
                        'class': 'radicalinstaller-project-page_gallery-images-element',
                        'style': 'display:block'
                    })
                        .add('img', {
                            'src': self.api + '/' + item.images.cover
                        })
                        .getParent();
                }
            }

            body = body.add('h2', {'class': 'radicalinstaller-project-page_gallery-header'}, item.title);
            body = body.addChild('div', {'class': 'radicalinstaller-project-page_buttons radicalinstaller-flex radicalinstaller-flex-space'});

            if (item.download_type === 'paid') {
                if (RadicalInstallerConfig.key !== '') {
                    body = body.add('button', {
                        'class': 'btn btn-success btn-large btn-install',
                        'disabled': 'disabled',
                        'events': [
                            [
                                'click',
                                function (ev) {
                                    self.installProject(item);
                                }
                            ]]
                    }, '<span class="icon-download large-icon"></span> ' + RadicalInstallerLangs.button_install);
                } else {
                    body = body.add('button', {
                        'class': 'btn btn-success btn-large',
                        'events': [
                            [
                                'click',
                                function (ev) {
                                    window.open(self.api + item.link, '_target');
                                    ev.preventDefault();
                                    return false;
                                }
                            ]]
                    }, RadicalInstallerLangs.button_buy);
                }

            } else {
                body = body.add('button', {
                    'class': 'btn btn-success btn-large btn-install',
                    'disabled': 'disabled',
                    'events': [
                        [
                            'click',
                            function (ev) {
                                self.installProject(item);
                            }
                        ]]
                }, '<span class="icon-download large-icon"></span> ' + RadicalInstallerLangs.button_install);
            }

            body = body.add('button', {
                'class': 'btn btn-danger btn-large btn-delete hide',
                'events': [
                    [
                        'click',
                        function (ev) {
                            self.deleteProject(item);
                            ev.preventDefault();
                            return false;
                        }
                    ]]
            }, RadicalInstallerLangs.button_delete);

            if (
                docs !== undefined &&
                docs !== false &&
                docs !== ''
            ) {
                body = body.add('a', {
                    'class': 'btn btn-large',
                    'target': '_blank',
                    'href': docs
                }, RadicalInstallerLangs.button_docs);
            }

            if (
                support !== undefined &&
                support !== false &&
                support !== ''
            ) {
                body = body.add('a', {
                    'class': 'btn btn-large',
                    'target': '_blank',
                    'href': support
                }, RadicalInstallerLangs.button_support);
            }

            body = body
                .add('a', {
                    'class': 'btn btn-large btn-text',
                    'target': '_blank',
                    'href': self.api + item.link
                }, RadicalInstallerLangs.button_extension_website)
                .getParent();

            body.add('div', {'class': 'radicalinstaller-project-page_description-header'}, RadicalInstallerLangs.description);

            if (
                item.fulltext !== undefined &&
                item.fulltext !== ''
            ) {
                body = body.add('div', {'class': 'radicalinstaller-project-page_description-text'}, item.fulltext);
            } else {
                if(item.introtext !== undefined && item.introtext !== '') {
                    body = body.add('div', {'class': 'radicalinstaller-project-page_description-text'}, item.introtext);
                } else {
                    body = body.add('div', {'class': 'radicalinstaller-project-page_description-text'}, RadicalInstallerLangs.text_no_description);
                }
            }

            header = header.build();
            body = body.build();

            // это остаточный код на будущее, выводит расширения которые должны быть установленны вместе с этим расширением
            if (item.fullwillbeinstalled !== undefined) {
                if (item.fullwillbeinstalled.length > 0) {
                    let relations_html = RadicalInstallerUtils.createElement('radicalinstaller-project-page_relations')
                        .add('h3', {
                            'class': 'radicalinstaller-project-page_relations-header'
                        }, RadicalInstallerLangs.will_be_installed)
                        .addChild('div', {
                            'class': 'radicalinstaller-project-page_relations-list'
                        });

                    for (let i = 0; i < item.fullwillbeinstalled.length; i++) {
                        relations_html = relations_html.add('div', {
                            'class': 'radicalinstaller-project-page_relations-list_link',
                            'events': [
                                [
                                    'click',
                                    function (ev) {
                                        self.showProject(item.fullwillbeinstalled[i].id)
                                        ev.preventDefault();
                                    }
                                ]
                            ]
                        }, item.fullwillbeinstalled[i].title);
                    }

                    relations_html = relations_html.getParent();
                    body.appendChild(relations_html.build());
                }

            }

            RadicalInstallerUtils.modal(header, body);

            // запрашиваем локально у сервера, установлено ли это расширение и рисуем нужные кнопки в зависимости от состояния
            RadicalInstallerUtils.ajaxGet(self.url + '&method=checkInstall&list=' + JSON.stringify([item.element]))
            .done(function (json) {
                let button_install = body.querySelector('.btn-install'),
                    button_delete = body.querySelector('.btn-delete'),
                    find = json.data[0];

                if (button_install !== undefined && button_install !== null) {
                    button_install.removeAttribute('disabled');
                }

                if (find.indexOf(item.element) !== -1) {
                    button_install.innerHTML = '<span class="icon-checkmark-2 large-icon"></span> ' + RadicalInstallerLangs.button_reinstall;
                    button_delete.classList.remove('hide');
                }

            });
        });
    },


    /**
     * Находит зависимости для проекта
     *
     *
     * @param project
     */
    findDepends: function (project) {
        let self = this;
        self.depends_wait = true;
        RadicalInstallerUtils.ajaxGet(self.url + '&method=getForInstallDepends&project_id=' + project.id,)
        .done(function (json) {
            let depends = JSON.parse(json.data);
            for (let i = 0; i < depends.length; i++) {
                self.list_install.push({id: depends[i].id, title: depends[i].title});
            }
            self.depends_wait = false;
        });
    },


    /**
     * Запуск установки проекта
     *
     * @param project
     * @param depends
     * @param show_modal
     * @param callback_success
     * @param callback_fail
     */
    installProject: function (project, show_modal, callback_success, callback_fail) {
        let self = this;

        self.project_install = {id: project.id, title: project.title};

        let fail = function (xhr){
            let modal_body = document.querySelector('.radicalinstaller-install-page'),
                buttons = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-flex radicalinstaller-flex-center radicalinstaller-flex-space'});

            buttons = buttons.add('button', {
                'class': 'btn btn-large',
                'events': [
                    [
                        'click',
                        function (ev) {
                            self.installProject(self.project_install, false);
                        }
                    ]
                ]
            }, '<span class="icon-loop"></span> ' + RadicalInstallerLangs.try_again)
                .add('button', {
                    'class': 'btn btn-large',
                    'events': [
                        [
                            'click',
                            function (ev) {
                                ev.target
                                    .closest('.radicalinstaller-modal_container')
                                    .querySelector('.radicalinstaller-modal_close')
                                    .click();
                            }
                        ]
                    ]
                }, RadicalInstallerLangs.button_close);

            modal_body.innerHTML = '';
            modal_body.appendChild(buttons.build());

            RadicalInstallerUtils.createAlert(RadicalInstallerLangs.error_install, 'danger',5000);
        };

        if (show_modal === null || show_modal === undefined || show_modal === true) {
            show_modal = true;
        } else {
            show_modal = false;
        }


        if (show_modal) {
            let header = RadicalInstallerUtils.createElement('h1', {'class': ''}, RadicalInstallerLangs.installing_an_extension),
                body = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-install-page'});

            body
                .addChild('div', {'class': 'radicalinstaller-flex radicalinstaller-flex-center'})
                    .add('img', {'src': self.assets + '/img/loader.svg'})
                    .getParent();

            RadicalInstallerUtils.modal(header.build(), body.build(), '', '', function () {
                if(self.check_main_after_install) {
                    self.checkMainExtension();
                }
            });
        }

        //получаем проект
        RadicalInstallerUtils.ajaxGet(self.url + '&method=project&project_id=' + self.project_install.id)
        .done( function (json) {
            let item = JSON.parse(json.data),
                install = item.install,
                url = '';

            if (install === '' || install === 'joomla') {
                url = self.url + '&method=installJoomla&id=' + item.id;
            }

            RadicalInstallerUtils.ajaxGet(url)
            .done( function (response) {
                let success = false,
                    modal_body = document.querySelector('.radicalinstaller-install-page'),
                    buttons = undefined,
                    messages = '',
                    data = JSON.parse(response['data']);


                if (data.messages !== undefined && data.messages !== null) {
                    for (let i = data.messages.length - 1; i >= 0; i--) {
                        messages += '<div class="alert alert-' + data.messages[i].type + '">' + data.messages[i].message + '</div>';
                    }
                }

                if (response.success === true) {
                    if (data.status === undefined || data.status === null || data.status === 'fail') {
                        success = false;
                    } else {
                        success = true;
                    }
                }

                if (!success) {
                    if (show_modal) {
                        buttons = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-flex radicalinstaller-flex-center radicalinstaller-flex-space'})
                            .add('button', {
                                'class': 'btn btn-large',
                                'events': [
                                    [
                                        'click',
                                        function (ev) {
                                            self.installProject(item, false);
                                        }
                                    ]
                                ]
                            }, '<span class="icon-loop"></span> ' + RadicalInstallerLangs.try_again);

                    }

                    if (typeof callback_fail === 'function') {
                        callback_fail();
                    }
                } else {

                    if (typeof callback_success === 'function') {
                        callback_success();
                    }

                    if (messages !== '') {
                        buttons = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-flex radicalinstaller-flex-center radicalinstaller-flex-space'})
                            .add('button', {
                                'class': 'btn btn-large',
                                'events': [
                                    [
                                        'click',
                                        function (ev) {
                                            ev.target
                                                .closest('.radicalinstaller-modal_container')
                                                .querySelector('.radicalinstaller-modal_close')
                                                .click();
                                        }
                                    ]
                                ]
                            }, RadicalInstallerLangs.button_close);
                    }

                    self.checkInstall();
                    self.checkUpdates();
                }

                if (show_modal) {

                    modal_body.innerHTML = '';

                    if (messages !== '') {
                        messages = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-install-page_messages'}, messages);
                        modal_body.appendChild(messages.build());
                    }

                    if (buttons !== undefined) {
                        modal_body.appendChild(buttons.build());
                    }
                }

            })
            .fail(fail);
        })
        .fail(fail);

    },


    deleteProject: function (project, show_modal, callback_success, callback_fail) {
        let is_delete = confirm(RadicalInstallerLangs.question_extension_delete);

        if(!is_delete)
        {
            return;
        }

        let self = this,
            url = '';

        self.project_delete = {id: project.id, title: project.title};

        if (
            show_modal === null ||
            show_modal === undefined ||
            show_modal === true
        ) {
            show_modal = true;
        } else {
            show_modal = false;
        }

        if (show_modal) {
            let header = RadicalInstallerUtils.createElement('h1', {'class': ''}, RadicalInstallerLangs.delete_an_extension),
                body = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-delete-page'});

            body
                .addChild('div', {'class': 'radicalinstaller-flex radicalinstaller-flex-center'})
                    .add('img', {'src': self.assets + '/img/loader.svg'})
                    .getParent();

            RadicalInstallerUtils.modal(header.build(), body.build(), '', '', function () {
                if(self.check_main_after_install) {
                    self.checkMainExtension();
                }
            });
        }


        url = self.url + '&method=deleteJoomla&id=' + self.project_delete.id;

        RadicalInstallerUtils.ajaxGet(url)
            .done( function (response) {
                let success = false,
                    modal_body = document.querySelector('.radicalinstaller-delete-page'),
                    buttons = '',
                    messages = '',
                    data = JSON.parse(response['data']);

                if (data.messages !== undefined && data.messages !== null) {
                    for (let i = data.messages.length - 1; i >= 0; i--) {
                        messages += '<div class="alert alert-' + data.messages[i].type + '">' + data.messages[i].message + '</div>';
                    }
                }

                if (response.success === true) {
                    if (data.status === undefined || data.status === null || data.status === 'fail') {
                        success = false;
                    } else {
                        success = true;
                    }
                }

                if (!success) {
                    if (show_modal) {
                        buttons = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-flex radicalinstaller-flex-center radicalinstaller-flex-space'})
                            .add('button', {
                                'class': 'btn btn-large',
                                'events': [
                                    [
                                        'click',
                                        function (ev) {
                                            self.deleteProject(project, false);
                                        }
                                    ]
                                ]
                            }, '<span class="icon-loop"></span> ' + RadicalInstallerLangs.try_again);
                    }

                    if (typeof callback_fail === 'function') {
                        callback_fail();
                    }
                } else {

                    if (messages !== '') {
                        buttons = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-flex radicalinstaller-flex-center radicalinstaller-flex-space'})
                            .add('button', {
                                'class': 'btn btn-large',
                                'events': [
                                    [
                                        'click',
                                        function (ev) {
                                            ev.target
                                                .closest('.radicalinstaller-modal_container')
                                                .querySelector('.radicalinstaller-modal_close')
                                                .click();
                                        }
                                    ]
                                ]
                            }, RadicalInstallerLangs.button_close);
                    }

                    if (typeof callback_success === 'function') {
                        callback_success();
                    }

                    self.checkMainExtension();
                    self.checkInstall();
                }

                if (show_modal) {

                    modal_body.innerHTML = '';

                    if (messages !== '') {
                        messages = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-delete-page_messages'}, messages);
                        modal_body.appendChild(messages.build());
                    }

                    if (buttons !== undefined) {
                        modal_body.appendChild(buttons.build());
                    }
                }

            })
            .fail(function (xhr){
                let modal_body = document.querySelector('.radicalinstaller-install-page'),
                    buttons = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-flex radicalinstaller-flex-center radicalinstaller-flex-space'});

                buttons = buttons.add('button', {
                    'class': 'btn btn-large',
                    'events': [
                        [
                            'click',
                            function (ev) {
                                self.deleteProject(self.project_delete, false);
                            }
                        ]
                    ]
                }, '<span class="icon-loop"></span> ' + RadicalInstallerLangs.try_again)
                    .add('button', {
                        'class': 'btn btn-large',
                        'events': [
                            [
                                'click',
                                function (ev) {
                                    ev.target
                                        .closest('.radicalinstaller-modal_container')
                                        .querySelector('.radicalinstaller-modal_close')
                                        .click();
                                }
                            ]
                        ]
                    }, RadicalInstallerLangs.button_close);

                modal_body.innerHTML = '';
                modal_body.appendChild(buttons.build());

                RadicalInstallerUtils.createAlert(RadicalInstallerLangs.error_uninstall, 'danger',5000);
            });

    },


    /**
     * Установить цвета для карточек расширений
     */
    setColors: function () {
        let self = this,
            cards = self.container.querySelectorAll('.radicalinstaller-card');

        for (let i = 0; i < cards.length; i++) {
            let color = cards[i].querySelector('.radicalinstaller-card_color'),
                text = cards[i].querySelector('.radicalinstaller-card_title');
            if(color !== undefined && color !== null) {
                color.style.backgroundColor = RadicalInstallerUtils.generateColorFromText(text.textContent);
            }
        }

    },


    /**
     * Проверка установленных расширений
     */
    checkInstall: function () {
        let self = this,
            list_for_find = [],
            cards = self.container.querySelectorAll('.radicalinstaller-card');

        for (let i = 0; i < cards.length; i++) {
            cards[i].classList.remove('radicalinstaller-card_installed');
            list_for_find.push(cards[i].getAttribute('data-element'));
        }

        RadicalInstallerUtils.ajaxGet(this.url + '&method=checkInstall&list=' + JSON.stringify(list_for_find))
        .done( function (json) {
            let find = json.data[0];
            for (let i = 0; i < find.length; i++) {
                let card = self.container.querySelector('.radicalinstaller-card[data-element="' + find[i] + '"]');
                if (card !== null) {
                    card.classList.add('radicalinstaller-card_installed');
                    card.setAttribute('data-installed', RadicalInstallerLangs.button_installed);
                }
            }
        });

    },


    /**
     * Проверка обновлений
     */
    checkUpdates: function () {
        let self = this,
            button_check_update = document.querySelector('.btn-check-update');

        if (button_check_update !== null && button_check_update !== undefined) {
            RadicalInstallerUtils.ajaxGet(self.url + '&method=checkUpdates').done( function (response) {
                let data = JSON.parse(response.data);
                if (parseInt(data.count) > 0) {
                    button_check_update.innerHTML = '<span>' + data.count + '</span> ' + RadicalInstallerLangs.button_update;
                } else {
                    button_check_update.innerHTML = '<span class="empty">' + data.count + '</span> ' + RadicalInstallerLangs.button_update;
                }
            });
        }

    },


    /**
     * Проверка на основные расширения
     *
     */
    checkMainExtension: function () {
        let self = this;
        RadicalInstallerUtils.ajaxGet(self.url + '&method=checkMainExtension')
            .done(function (response) {

                let data = response.data[0];

                if (data.status === 'ok') {
                    self.showCatalog();
                }

                if (data.status === 'notinstall') {
                    let grid = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-grid'}),
                        grid_element = null;

                    self.renderPage({
                        header: 'Выберите главное расширение',
                        description: 'Каталог расширений разблокируется после установки одного из главных расширений.',
                        content: grid.build(),
                        sidebar: [
                            {template: 'support'},
                            {template: 'faq'}
                        ]
                    });

                    self.loaderInit();
                    self.loaderShow();
                    grid_element = self.container.querySelector('.radicalinstaller-grid');

                    for (let i=0;i<data.items.length;i++) {
                        grid_element.append(self.renderCatalogGrid(data.items[i]).build());
                    }

                    self.setColors();
                    self.loaderHide();
                    self.check_main_after_install = true;
                }
            })
            .fail(function (xhr) {
                RadicalInstallerUtils.createAlert(RadicalInstallerLangs.error_check_main_extensions, 'danger', 5000);
            });
    },


    /**
     * Показ обновлений расширений
     *
     */
    showUpdates: function () {
        let self = this;
        RadicalInstallerUtils.ajaxGet(self.url + '&method=checkUpdates')
            .done(function(response) {
                let data = JSON.parse(response.data);

                let header = RadicalInstallerUtils.createElement('h2', {'class': ''}, RadicalInstallerLangs.extension_updates);
                let body = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-updates-page'});
                body = body.addChild('div', {'class': 'radicalinstaller-updates-page_buttons'})
                    .add('button', {
                        'class': 'btn btn-success btn-large',
                        'events': [
                            [
                                'click',
                                function (ev) {
                                    for (let i = 0; i < data.items.length; i++) {
                                        RadicalInstallerUtils.ajaxGet(self.url + '&method=project&project_id=' + data.items[i].project_id)
                                        .done(function (json) {
                                            let item = JSON.parse(json.data),
                                                element = document.querySelector('.radicalinstaller-updates-page_tables-element-id-' + data.items[i].project_id);
                                                btn = element.querySelector('.btn');

                                            if (btn !== null) {
                                                btn.setAttribute('disabled', 'disabled');
                                                btn.innerHTML = RadicalInstallerLangs.updating;
                                            }

                                            self.installProject(item, false, false, function (data, messages) {
                                                element.remove();
                                                let table = document.querySelector('.radicalinstaller-updates-page_tables');

                                                if (table !== null) {
                                                    if (table.querySelectorAll('tbody tr').length === 0) {
                                                        self.showUpdates();
                                                        self.checkUpdates();
                                                    }
                                                }
                                            }, function () {
                                                if (btn !== null) {
                                                    btn.removeAttribute('disabled');
                                                    btn.innerHTML = RadicalInstallerLangs.update;
                                                }
                                            });
                                        });
                                    }
                                    ev.preventDefault();
                                }
                            ]
                        ]
                    }, '<span class="icon-download large-icon"></span> ' + RadicalInstallerLangs.button_update_all)
                    .add('button', {
                        'class': 'btn btn-large',
                        'events': [
                            [
                                'click',
                                function (ev) {
                                    self.showUpdates();
                                    ev.preventDefault();
                                }
                            ]
                        ]
                    }, '<span class="icon-loop large-icon"></span> ' + RadicalInstallerLangs.button_update_check);

                if (parseInt(data.count) > 0) {
                    body =
                        body.addChild('table', {'class': 'radicalinstaller-updates-page_tables table table-striped table-hover'})
                                .addChild('thead')
                                    .addChild('tr')
                                        .add('th', {}, RadicalInstallerLangs.extension_name)
                                        .add('th', {}, RadicalInstallerLangs.current_version)
                                        .add('th', {}, RadicalInstallerLangs.new_version)
                                        .add('th', {}, '')
                                        .getParent()
                                .getParent()
                            .addChild('tbody')

                    for (let i = 0; i < data.items.length; i++) {
                        body =
                            body.addChild('tr', {'class': 'radicalinstaller-updates-page_tables-element-id-' + data.items[i].project_id})
                                    .add('td', {}, data.items[i].title)
                                    .add('td', {}, data.items[i].version)
                                    .add('td', {}, data.items[i].version_last)
                                        .addChild('td')
                                            .add('button', {
                                    'class': 'btn', 'events': [
                                        [
                                            'click',
                                            function (ev) {
                                                RadicalInstallerUtils.ajaxGet(self.url + '&method=project&project_id=' + data.items[i].project_id)
                                                .done( function (json) {
                                                    let item = JSON.parse(json.data);
                                                    let element = document.querySelector('.radicalinstaller-updates-page_tables-element-id-' + data.items[i].project_id);
                                                    let btn = element.querySelector('.btn');

                                                    if (btn !== null) {
                                                        btn.setAttribute('disabled', 'disabled');
                                                        btn.innerHTML = RadicalInstallerLangs.updating;
                                                    }

                                                    self.installProject(item, false, false, function (data, messages) {
                                                        element.remove();
                                                        self.checkUpdates();
                                                    }, function () {
                                                        if (btn !== null) {
                                                            btn.removeAttribute('disabled');
                                                            btn.innerHTML = RadicalInstallerLangs.update;
                                                        }
                                                    });

                                                });
                                            }
                                        ]
                                    ]
                                }, RadicalInstallerLangs.button_update_select)
                                            .getParent()
                                    .getParent()
                    }

                    body = body.getParent().getParent();
                } else {
                    body = body.add('div', {'class': 'radicalinstaller-updates-empty'}, RadicalInstallerLangs.no_updates)
                }

                header = header.build();
                body = body.build();

                RadicalInstallerUtils.modal(header, body);
         });
    },


    /**
     * Показ установленных расширений
     *
     */
    showInstalled: function () {
        let self = this;
        RadicalInstallerUtils.ajaxGet(self.url + '&method=installedList').done(function (response) {
            let data = response.data[0];
            let header = RadicalInstallerUtils.createElement('h2', {'class': ''}, RadicalInstallerLangs.extension_installed);
            let body = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-installed-page'});

            if (data.length > 0) {
                body =
                    body.addChild('table', {'class': 'radicalinstaller-installed-page_tables table table-striped table-hover'})
                            .addChild('thead')
                                .addChild('tr')
                                    .add('th', {}, RadicalInstallerLangs.extension_name)
                                    .add('th', {}, RadicalInstallerLangs.current_version)
                                    .add('th', {}, '')
                                    .getParent()
                                .getParent()
                        .addChild('tbody')

                for (let i = 0; i < data.length; i++) {
                    body =
                        body.addChild('tr', {'class': 'radicalinstaller-installed-page_tables-element-id-' + data[i].project_id})
                                .add('td', {}, data[i].title)
                                .add('td', {}, data[i].version)
                                    .addChild('td', {'class': 'radicalinstaller-installed-page_buttons'})
                                        .add('button', {'class': 'btn btn-width-fixed', 'events': [
                                            [
                                                'click',
                                                function (ev) {
                                                    self.showProject(data[i].project_id);
                                                    ev.preventDefault();
                                                }
                                            ]
                                        ]}, RadicalInstallerLangs.button_view)
                                        .add('button', {'class': 'btn btn-danger btn-width-fixed', 'events': [
                                                [
                                                    'click',
                                                    function (ev) {
                                                        self.deleteProject({id: data[i].project_id, title: data[i].title});
                                                        ev.preventDefault();
                                                    }
                                                ]
                                            ]}, RadicalInstallerLangs.button_delete)
                                    .getParent()
                                .getParent()
                }

                body = body.getParent().getParent();
            } else {
                body = body.add('div', {'class': 'radicalinstaller-installed-empty'}, RadicalInstallerLangs.no_installed)
            }

            header = header.build();
            body = body.build();

            RadicalInstallerUtils.modal(header, body);

        });
    },


    renderPage: function (data) {
        let self = this,
            header_content = data.header,
            description_content = data.description,
            content_content = data.content,
            sidebar = data.sidebar,
            page = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-page'});

        page = page.add('h1', {'class': 'radicalinstaller-page_header'}, header_content);

        if(description_content !== '') {
            page = page.add('p', {'class': 'radicalinstaller-page_description'}, description_content);
        }

        page = page.addChild('div', {'class': 'radicalinstaller-page_wrap'})
                .add('div', {'class': 'radicalinstaller-page_content'})
                .addChild('div', {'class': 'radicalinstaller-page_sidebar radicalinstaller-background-muted'});

        if(
            typeof sidebar === 'object' ||
            typeof sidebar === 'array'
        )
        {
            for(let i=0;i<sidebar.length;i++)
            {
                let item_header = '',
                    item_content = '';

                if(
                    sidebar[i].template !== undefined &&
                    self.template_sidebar[sidebar[i].template] !== undefined
                )
                {
                    item_header = self.template_sidebar[sidebar[i].template].header;
                    item_content = self.template_sidebar[sidebar[i].template].content;
                }

                if(sidebar[i].header !== undefined && sidebar[i].content) {
                    item_header = sidebar[i].header;
                    item_content = sidebar[i].content;
                }

                page = page.addChild('div', {'class': 'radicalinstaller-page_sidebar-item'})
                    .add('h3', {'class': 'radicalinstaller-page_sidebar-item_title'}, item_header)
                    .add('div', {'class': 'radicalinstaller-page_sidebar-item_content'}, item_content)
                    .getParent();

            }
        }

        page = page.getParent().getParent();
        self.container.innerHTML = '';
        self.container.append(page.build());


        if(typeof content_content === 'object') {
            let content = document.querySelector('.radicalinstaller-page_content');

            if(content_content.nodeType === undefined) {
                for(let i=0;i<content_content.length;i++) {
                    content.append(content_content[i]);
                }
            } else {
                content.append(content_content);
            }
        }

    },

    /**
     * Отрисовывает карточку расширения
     *
     * @param item
     * @returns object
     */
    renderCatalogGrid: function (item) {
        let self = this;

            let color = '#ccc',
                docs = item.urls.documentation,
                support = item.urls.support;

            if (item.documentation !== undefined && item.documentation !== '' && item.documentation !== false) {
                docs = self.api + item.documentation;
            }

            if (item.params !== undefined) {
                item.params = JSON.parse(item.params);
            }

            if (item.params.attrs_color !== undefined && item.params.attrs_color !== '') {
                color = item.params.attrs_color;
            }

            let grid_cards = RadicalInstallerUtils.createElement('div', {}).
            addChild('div', {
                    'class': 'radicalinstaller-card radicalinstaller-card_extension',
                    'data-install': '0',
                    'data-element': item.element,
                    'events': [
                        [
                            'click',
                            function (ev) {
                                if (!ev.target.classList.contains('btn-install')) {
                                    self.showProject(item.id);
                                    ev.preventDefault();
                                }
                            }
                        ]
                    ]
                });

            if(item.images !== undefined)
            {
                grid_cards
                    .addChild('div', {'class': 'radicalinstaller-card_image'})
                        .add('div', {'class': 'radicalinstaller-card_color', 'style': 'opacity: .1'})
                        .add('div', {
                            'class': 'radicalinstaller-card_cover',
                            'style': item.images.cover !== false ? ('background-image:url(' + self.api + '/' + item.images.cover + ')') : ''
                        })
                        .getParent();
            }


            grid_cards.add('h3', {'class': 'radicalinstaller-card_title'}, item.title);

        return grid_cards;
    },


    /**
     * Добавление в DOM экрана загрузки
     */
    loaderInit: function () {
        let self = this,
            loader = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-loader hide'})
            .add('img', {'src': self.assets + '/img/loader.svg'});
        self.container.appendChild(loader.build());
    },

    /**
     * Запуск показа экрана загрузки
     */
    loaderShow: function () {
        let loader = document.querySelector('.radicalinstaller-loader');
        if (loader !== null) {
            loader.classList.remove('hide');
        }
    },


    /**
     * Скрытие экрана загрузки
     */
    loaderHide: function () {
        let loader = document.querySelector('.radicalinstaller-loader');
        if (loader !== null) {
            loader.classList.add('hide');
        }
    }

}