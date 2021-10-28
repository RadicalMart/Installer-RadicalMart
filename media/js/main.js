window.Hikasu = {
    api: 'https://radicalmart.ru',
    url: 'index.php?option=com_ajax&plugin=hikasu&group=installer&format=json',
    container: null,
    form: null,
    category_id: 0,
    categories: null,
    button_active: '',
    depends_wait: true,
    list_install: [],
    buy_projects: [],

    init: function () {
        let self = this;
        this.container = document.querySelector('#hikasu-container');
        this.form = document.querySelector('#adminForm');
        this.checkUpdates();

        self.categories = HikasuUtils.createElement('div', {'class': 'hikasu-categories'});
        self.categories.add('button', {
            'class': 'btn', 'data-type': 'installed', 'events': [
                [
                    'click',
                    function (ev) {
                        self.showInstalled();
                        ev.preventDefault();
                    }
                ]
            ]
        }, HikasuLangs.button_installed);

        self.categories.add('button', {
            'class': 'btn btn-check-update', 'data-type': 'update', 'events': [
                [
                    'click',
                    function (ev) {
                        self.showUpdates();
                        ev.preventDefault();
                    }
                ]
            ]
        }, '<span class="empty">0</span> ' + HikasuLangs.button_update);

        self.categories.add('button', {
            'class': 'btn btn-change-category', 'data-type': 'support', 'events': [
                [
                    'click',
                    function (ev) {
                        window.open(self.api + '/support', '_target');
                        ev.preventDefault();
                        return false;
                    }
                ]
            ]
        }, HikasuLangs.button_support);

        self.categories.add('button', {
            'class': 'btn btn-change-category', 'data-type': 'add', 'events': [
                [
                    'click',
                    function (ev) {
                        window.open(self.api + '/add', '_target');
                        ev.preventDefault();
                        return false;
                    }
                ]
            ]
        }, HikasuLangs.button_extension_add);

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
        }, 'Все расширения');

        let load_categories = function () {
            let url = self.url + '&method=categories';

            self.ajax(url, function (json) {
                json = JSON.parse(json.data);
                let categories_items = json.items;
                for (let i = 0; i < categories_items.length; i++) {
                    self.categories.add('button', {
                        'class': 'btn btn-change-category', 'data-type': 'category-' + categories_items[i].id, 'events': [
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

                let search_categories = self.container.querySelector('.hikasu-categories');

                if(search_categories !== null && search_categories !== undefined) {
                    search_categories.remove();
                    self.container.prepend(self.categories.build());
                }
            });
        }

        self.changeCategory(self.category_id);
        load_categories();
    },

    changeCategory: function (id) {
        let self = this;
        let grid = HikasuUtils.createElement('div', {'class': 'hikasu-grid'});
        let pagination = HikasuUtils.createElement('div', {'class': 'hikasu-pagination'});

        self.container.innerHTML = '';
        self.loaderInit();
        self.loaderShow();

        if(HikasuConfig.key !== '') {
            let url = self.url + '&method=buyprojects';

            self.ajax(url, function (json) {
                json = JSON.parse(json.data);
                self.buy_projects = json.items;
            });
        }

        let load_page = function (page, limit) {
            let url = self.url + '&method=projects&category_id=' + id;

            if (page !== null) {
                url += '&page=' + page;
            }

            if (limit !== null) {
                url += 'l&imit=' + limit;
            }

            self.ajax(url, function (json) {
                json = JSON.parse(json.data);
                let cards = json.items;
                for (let i = 0; i < cards.length; i++) {
                    let color = '#ccc',
                        docs = cards[i].urls.documentation,
                        support = cards[i].urls.support;

                    if (cards[i].documentation !== undefined && cards[i].documentation !== '' && cards[i].documentation !== false) {
                        docs = self.api + cards[i].documentation;
                    }

                    if (cards[i].params !== undefined) {
                        cards[i].params = JSON.parse(cards[i].params);
                    }

                    if (cards[i].params.attrs_color !== undefined && cards[i].params.attrs_color !== '') {
                        color = cards[i].params.attrs_color;
                    }

                    let grid_cards = HikasuUtils.createElement('div', {})
                        .addChild('div', {
                            'class': 'hikasu-card',
                            'data-install': '0',
                            'data-element': cards[i].element,
                            'events': [
                                [
                                    'click',
                                    function (ev) {
                                        if (!ev.target.classList.contains('btn-install')) {
                                            self.showProject(cards[i].id);
                                            ev.preventDefault();
                                        }
                                    }
                                ]
                            ]
                        })
                        .addChild('div', {'class': 'hikasu-card_image'})
                            .add('div', {'class': 'hikasu-card_color', 'style': 'opacity: .1'})
                            .add('div', {
                                'class': 'hikasu-card_cover',
                                'style': cards[i].images.cover !== false ? ('background-image:url(' + self.api + '/' + cards[i].images.cover + ')') : ''
                            })
                            .getParent()
                        .add('h3', {'class': 'hikasu-card_title'}, cards[i].title)
                        .add('div', {'class': 'hikasu-card_description'}, cards[i].introtext)
                            .addChild('div', {'class': 'hikasu-card_actions'});

                    if (cards[i].download_type === 'free') {
                        grid_cards = grid_cards.add('button', {
                            'class': 'btn btn-success btn-install', 'events': [
                                [
                                    'click',
                                    function (ev) {
                                        self.installProject(cards[i]);
                                        ev.preventDefault();
                                    }
                                ]]
                        }, '<span class="icon-download"></span> ' + HikasuLangs.button_install);
                    }
                    if (cards[i].download_type === 'paid') {
                        if (HikasuConfig.key !== '') {
                            grid_cards = grid_cards.add('button', {
                                'class': 'btn btn-success btn-install', 'events': [
                                    [
                                        'click',
                                        function (ev) {
                                            self.installProject(cards[i]);
                                            ev.preventDefault();
                                        }
                                    ]]
                            }, '<span class="icon-download"></span> ' + HikasuLangs.button_install);
                        } else {
                            grid_cards = grid_cards.add('button', {
                                'class': 'btn btn-success', 'events': [
                                    [
                                        'click',
                                        function (ev) {
                                            window.open(self.api + cards[i].link, '_target');
                                            ev.preventDefault();
                                            return false;
                                        }
                                    ]]
                            }, 'Купить');
                        }

                    }


                    grid_cards = grid_cards.add('button', {
                        'class': 'btn', 'data-id': cards[i].id, 'events': [
                            [
                                'click',
                                function (ev) {
                                    let id = this.getAttribute('data-id');
                                    self.showProject(id);
                                    ev.preventDefault();
                                    return false;
                                }
                            ]
                        ]
                    }, HikasuLangs.button_more)
                        .getParent()
                        .getParent();

                    self.container.querySelector('.hikasu-grid').append(grid_cards.build());

                }


                self.setColors();
                self.checkInstall();
                self.checkUpdates();
                self.loaderHide();

                self.container.querySelector('.hikasu-pagination').innerHTML = '';
                if (json.pagination !== undefined) {
                    let last_page = parseInt(json.pagination.pagesTotal),
                        page_limit = parseInt(json.pagination.limit),
                        current_page = parseInt(json.pagination.pagesCurrent);

                    if (last_page > current_page) {
                        let pagination_button = HikasuUtils.createElement('button', {
                            'class': 'btn btn-large hikasu-pagination_more', 'events': [
                                [
                                    'click',
                                    function (ev) {
                                        load_page(current_page + 1, page_limit);
                                        ev.preventDefault();
                                        return true;
                                    }
                                ]
                            ]
                        }, HikasuLangs.button_load_more);

                        self.container.querySelector('.hikasu-pagination').append(pagination_button.build());
                    }

                }

            });
        }

        self.category_id = id;
        load_page();
        self.container.append(self.categories.build());
        self.container.append(grid.build());
        self.container.append(pagination.build());

        let buttons_all = document.querySelectorAll('.hikasu-categories button');
        for (let i = 0; i < buttons_all.length; i++) {
            buttons_all[i].classList.remove('btn-active');
        }

        let button_active = document.querySelector('button[data-type="category-' + self.category_id + '"]');
        if (button_active !== null && button_active !== undefined) {
            button_active.classList.add('btn-active');
        }
    },

    showProject: function (id) {
        let self = this;
        self.ajax(self.url + '&method=project&project_id=' + id, function (json) {
            let item = JSON.parse(json.data);
            let header = HikasuUtils.createElement('div');
            let body = HikasuUtils.createElement('div', {'class': 'hikasu-project-page'});
            let color = HikasuUtils.generateColorFromText(item.title),
                docs = item.urls.documentation,
                support = item.urls.support;

            if (item.documentation !== undefined && item.documentation !== false && item.documentation !== '') {
                docs = self.api + item.documentation;
            }

            if (item.params !== undefined) {
                if (item.params.attrs_color !== undefined && item.params.attrs_color !== '') {
                    color = item.params.attrs_color;
                }
            }

            if (item.gallery.length > 0) {
                header = header.addChild('div', {'class': 'hikasu-project-page_gallery-images', 'data-active': 1})
                    .add('div', {
                        'class': 'hikasu-project-page_gallery-images-background',
                        'style': 'background-color: ' + color
                    });
                for (let i = 0; i < item.gallery.length; i++) {
                    header = header.addChild('div', {
                        'class': 'hikasu-project-page_gallery-images-element',
                        'style': i === 0 ? 'display:block' : 'display:none'
                    })
                        .add('img', {
                            'alt': item.gallery[i].text,
                            'src': self.api + '/' + item.gallery[i].src
                        })
                        .add('div', {'class': 'hikasu-project-page_gallery-images-element_caption'}, item.gallery[i].text)
                        .getParent();
                }
                header = header.add('button', {
                    'class': 'hikasu-project-page_gallery-images-prev', 'events': [
                        [
                            'click', function (ev) {
                            let i;
                            let slideshow = this.closest(".hikasu-project-page_gallery-images");
                            let slides = slideshow.querySelectorAll('.hikasu-project-page_gallery-images-element');
                            let active = parseInt(slideshow.getAttribute('data-active'));
                            active = active - 1;

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
                    'class': 'hikasu-project-page_gallery-images-next', 'events': [
                        [
                            'click', function (ev) {
                            let i;
                            let slideshow = this.closest(".hikasu-project-page_gallery-images");
                            let slides = slideshow.querySelectorAll('.hikasu-project-page_gallery-images-element');
                            let active = parseInt(slideshow.getAttribute('data-active'));
                            active = active + 1;

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
                    header = header.addChild('div', {'class': 'hikasu-project-page_gallery-images', 'data-active': 1})
                        .add('div', {
                            'class': 'hikasu-project-page_gallery-images-background',
                            'style': 'background-color: ' + color
                        });
                    header = header.addChild('div', {
                        'class': 'hikasu-project-page_gallery-images-element',
                        'style': 'display:block'
                    })
                        .add('img', {
                            'src': self.api + '/' + item.images.cover
                        })
                        .getParent();
                }
            }

            body = body.add('h2', {'class': 'hikasu-project-page_gallery-header'}, item.title);
            body = body.addChild('div', {'class': 'hikasu-project-page_buttons'});

            if (item.download_type === 'paid') {
                if (HikasuConfig.key !== '') {
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
                    }, '<span class="icon-download large-icon"></span> ' + HikasuLangs.button_install);
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
                    }, 'Купить');
                }

            }
            else
            {
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
                }, '<span class="icon-download large-icon"></span> ' + HikasuLangs.button_install);
            }

            if (docs !== undefined && docs !== false && docs !== '') {
                body = body.add('a', {
                    'class': 'btn btn-large',
                    'target': '_blank',
                    'href': docs
                }, HikasuLangs.button_docs);
            }

            body = body.add('a', {
                'class': 'btn btn-large',
                'target': '_blank',
                'href': support
            }, HikasuLangs.button_support)
                .add('a', {
                    'class': 'btn btn-large btn-text',
                    'target': '_blank',
                    'href': self.api + item.link
                }, HikasuLangs.button_extension_website)
                .getParent();


            body.add('div', {'class': 'hikasu-project-page_description-header'}, HikasuLangs.description);

            if (item.fulltext !== undefined && item.fulltext !== '') {
                body = body.add('div', {'class': 'hikasu-project-page_description-text'}, item.fulltext);
            } else {
                body = body.add('div', {'class': 'hikasu-project-page_description-text'}, item.introtext);
            }

            header = header.build();
            body = body.build();

            if (item.fullwillbeinstalled !== undefined) {
                if (item.fullwillbeinstalled.length > 0) {
                    let relations_html = HikasuUtils.createElement('hikasu-project-page_relations')
                        .add('h3', {
                            'class': 'hikasu-project-page_relations-header'
                        }, HikasuLangs.will_be_installed)
                        .addChild('div', {
                            'class': 'hikasu-project-page_relations-list'
                        });

                    for (let i = 0; i < item.fullwillbeinstalled.length; i++) {
                        relations_html = relations_html.add('div', {
                            'class': 'hikasu-project-page_relations-list_link',
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

            HikasuUtils.modal(header, body);

            self.ajax(self.url + '&method=checkInstall&list=' + JSON.stringify([item.element]), function (json) {
                let buttonInstall = body.querySelector('.btn-install');
                let find = json.data[0];

                if (buttonInstall !== undefined && buttonInstall !== null) {
                    buttonInstall.removeAttribute('disabled');
                }

                if (find.indexOf(item.element) !== -1) {
                    buttonInstall.innerHTML = '<span class="icon-checkmark-2 large-icon"></span> ' + HikasuLangs.button_reinstall;
                }

            });
        });
    },

    findDepends: function (project) {
        let self = this;
        self.depends_wait = true;
        this.ajax(self.url + '&method=getForInstallDepends&project_id=' + project.id, function (json) {
            let depends = JSON.parse(json.data);
            for (let i = 0; i < depends.length; i++) {
                self.list_install.push({id: depends[i].id, title: depends[i].title});
            }
            self.depends_wait = false;
        });
    },

    installProject: function (project, depends, show_modal, callback_success, callback_fail) {
        let self = this;

        self.list_install = [];
        self.list_install.push({id: project.id, title: project.title});

        if (depends === null || depends === undefined || depends === true) {
            self.findDepends(project);
        } else {
            self.depends_wait = false;
        }

        if (show_modal === null || show_modal === undefined || show_modal === true) {
            show_modal = true;
        } else {
            show_modal = false;
        }

        let waitGetListDepends = setInterval(function () {

            if (self.depends_wait) {
                return;
            }

            if (show_modal) {
                let header = HikasuUtils.createElement('h1', {'class': ''}, HikasuLangs.installing_an_extension);
                let body = HikasuUtils.createElement('div', {'class': 'hikasu-install-page'});

                body =
                    body.addChild('table', {'class': 'hikasu-updates-page_tables table table-striped table-hover'})
                        .addChild('thead')
                        .addChild('tr')
                        .add('th', {}, HikasuLangs.extension_name)
                        .add('th', {}, HikasuLangs.status)
                        .add('th', {}, '')
                        .getParent()
                        .getParent()
                        .addChild('tbody');

                for (let i = 0; i < self.list_install.length; i++) {
                    body =
                        body.addChild('tr', {'class': 'hikasu-install-page_tables-element-id-' + self.list_install[i].id})
                            .add('td', {}, self.list_install[i].title)
                            .add('td', {'class': 'hikasu-install-page_tables-element-status'}, HikasuLangs.wait)
                            .add('td', {'class': 'hikasu-install-page_tables-element-action'})
                            .getParent()
                            .addChild('tr', {'class': 'hikasu-install-page_tables-element-messages'})
                            .add('td', {
                                'class': 'hikasu-install-page_tables-element-id-' + self.list_install[i].id + '-messages hidden',
                                'colspan': 3
                            })
                            .getParent()
                }

                body = body.getParent().getParent();
                HikasuUtils.modal(header.build(), body.build());
            }

            //проходим что нам надо установить и ставим
            for (let i = 0; i < self.list_install.length; i++) {

                //получаем проект
                self.ajax(self.url + '&method=project&project_id=' + self.list_install[i].id, function (json) {
                    let item = JSON.parse(json.data);
                    let install = item.install;
                    let url = '';

                    if (install === '' || install === 'joomla') {
                        url = self.url + '&method=installJoomla&id=' + item.id;
                    }

                    self.ajax(url, function (response) {
                        let element;
                        let success = false;
                        let modal_body = document.querySelector('.hikasu-install-page_loader');
                        let buttons = undefined;
                        let messages = '';
                        let data = JSON.parse(response['data']);

                        if (show_modal) {
                            element = document.querySelector('.hikasu-install-page_tables-element-id-' + item.id);
                            element.querySelector('.hikasu-install-page_tables-element-action').innerHTML = '';
                        }

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
                                element.querySelector('.hikasu-install-page_tables-element-status').innerHTML = HikasuLangs.installation_error;
                                buttons = HikasuUtils.createElement('div', {'class': 'hikasu-install-page_buttons'})
                                    .add('button', {
                                        'class': 'btn',
                                        'events': [
                                            [
                                                'click',
                                                function (ev) {
                                                    self.installProject(item, false);
                                                }
                                            ]
                                        ]
                                    }, '<span class="icon-loop"></span> ' + HikasuLangs.try_again);

                                if (messages !== '') {
                                    buttons = buttons.add('button', {
                                        'class': 'btn',
                                        'events': [
                                            [
                                                'click',
                                                function (ev) {
                                                    let element_messages = document.querySelector('.hikasu-install-page_tables-element-id-' + item.id + '-messages');

                                                    if (element_messages.classList.contains('hidden')) {
                                                        this.innerHTML = HikasuLangs.hide_messages;
                                                        element_messages.classList.remove('hidden');
                                                    } else {
                                                        this.innerHTML = HikasuLangs.show_messages;
                                                        element_messages.classList.add('hidden');
                                                    }
                                                }
                                            ]
                                        ]
                                    }, HikasuLangs.show_messages);
                                }
                            }

                            if (typeof callback_fail === 'function') {
                                callback_fail();
                            }
                        } else {
                            if (show_modal) {
                                element.querySelector('.hikasu-install-page_tables-element-status').innerHTML = HikasuLangs.button_installed;
                            }

                            if (messages !== '') {
                                buttons = HikasuUtils.createElement('div', {'class': 'hikasu-install-page_buttons'})
                                    .add('button', {
                                        'class': 'btn',
                                        'events': [
                                            [
                                                'click',
                                                function (ev) {
                                                    let element_messages = document.querySelector('.hikasu-install-page_tables-element-id-' + item.id + '-messages');

                                                    if (element_messages.classList.contains('hidden')) {
                                                        this.innerHTML = HikasuLangs.hide_messages;
                                                        element_messages.classList.remove('hidden');
                                                    } else {
                                                        this.innerHTML = HikasuLangs.show_messages;
                                                        element_messages.classList.add('hidden');
                                                    }
                                                }
                                            ]
                                        ]
                                    }, HikasuLangs.show_messages);
                            }

                            if (typeof callback_success === 'function') {
                                callback_success();
                            }

                            self.checkInstall();
                            self.checkUpdates();
                        }

                        if (show_modal) {
                            if (buttons !== undefined) {
                                element.querySelector('.hikasu-install-page_tables-element-action').appendChild(buttons.build());
                            }

                            if (messages !== '') {
                                let element_messages = document.querySelector('.hikasu-install-page_tables-element-id-' + self.list_install[i].id + '-messages');

                                element_messages.innerHTML = '';
                                messages = HikasuUtils.createElement('div', {'class': 'hikasu-install-page_messages'}, messages);
                                element_messages.appendChild(messages.build());
                            }
                        }

                    });

                });
            }


            clearInterval(waitGetListDepends);

        }, 300);

    },

    setColors: function () {
        let self = this;
        let cards = self.container.querySelectorAll('.hikasu-card');

        for (let i = 0; i < cards.length; i++) {
            let color = cards[i].querySelector('.hikasu-card_color');
            let text = cards[i].querySelector('.hikasu-card_title');
            color.style.backgroundColor = HikasuUtils.generateColorFromText(text.textContent);
        }

    },

    checkInstall: function () {
        let self = this,
            list_for_find = [],
            cards = self.container.querySelectorAll('.hikasu-card');

        for (let i = 0; i < cards.length; i++) {
            list_for_find.push(cards[i].getAttribute('data-element'));
        }

        this.ajax(this.url + '&method=checkInstall&list=' + JSON.stringify(list_for_find), function (json) {
            let find = json.data[0];
            for (let i = 0; i < find.length; i++) {
                let card = self.container.querySelector('.hikasu-card[data-element="' + find[i] + '"]');
                if (card !== null) {
                    card.setAttribute('data-install', '1');
                    let button = card.querySelector('.btn-success');
                    button.setAttribute('disabled', 'disabled');
                    button.innerHTML = '<span class="icon-checkmark-2"></span> ' + HikasuLangs.button_installed;
                }
            }
        });

    },

    checkUpdates: function () {
        let self = this;
        let button_check_update = document.querySelector('.btn-check-update');

        if (button_check_update !== null && button_check_update !== undefined) {
            self.ajax(self.url + '&method=checkUpdates', function (response) {
                let data = JSON.parse(response.data);
                if (parseInt(data.count) > 0) {
                    button_check_update.innerHTML = '<span>' + data.count + '</span> ' + HikasuLangs.button_update;
                } else {
                    button_check_update.innerHTML = '<span class="empty">' + data.count + '</span> ' + HikasuLangs.button_update;
                }
            });
        }

    },

    showUpdates: function () {
        let self = this;
        self.ajax(self.url + '&method=checkUpdates', function (response) {
            let data = JSON.parse(response.data);

            let header = HikasuUtils.createElement('h2', {'class': ''}, HikasuLangs.extension_updates);
            let body = HikasuUtils.createElement('div', {'class': 'hikasu-updates-page'});
            body = body.addChild('div', {'class': 'hikasu-updates-page_buttons'})
                .add('button', {
                    'class': 'btn btn-success btn-large',
                    'events': [
                        [
                            'click',
                            function (ev) {
                                for (let i = 0; i < data.items.length; i++) {
                                    self.ajax(self.url + '&method=project&project_id=' + data.items[i].project_id, function (json) {
                                        let item = JSON.parse(json.data);
                                        let element = document.querySelector('.hikasu-updates-page_tables-element-id-' + data.items[i].project_id);
                                        let btn = element.querySelector('.btn');

                                        if (btn !== null) {
                                            btn.setAttribute('disabled', 'disabled');
                                            btn.innerHTML = HikasuLangs.updating;
                                        }

                                        self.installProject(item, false, false, function (data, messages) {
                                            element.remove();
                                            let table = document.querySelector('.hikasu-updates-page_tables');

                                            if (table !== null) {
                                                if (table.querySelectorAll('tbody tr').length === 0) {
                                                    self.showUpdates();
                                                    self.checkUpdates();
                                                }
                                            }
                                        }, function () {
                                            if (btn !== null) {
                                                btn.removeAttribute('disabled');
                                                btn.innerHTML = HikasuLangs.update;
                                            }
                                        });
                                    });
                                }
                                ev.preventDefault();
                            }
                        ]
                    ]
                }, '<span class="icon-download large-icon"></span> ' + HikasuLangs.button_update_all)
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
                }, '<span class="icon-loop large-icon"></span> ' + HikasuLangs.button_update_check);

            if (parseInt(data.count) > 0) {
                body =
                    body.addChild('table', {'class': 'hikasu-updates-page_tables table table-striped table-hover'})
                        .addChild('thead')
                        .addChild('tr')
                        .add('th', {}, HikasuLangs.extension_name)
                        .add('th', {}, HikasuLangs.current_version)
                        .add('th', {}, HikasuLangs.new_version)
                        .add('th', {}, '')
                        .getParent()
                        .getParent()
                        .addChild('tbody')

                for (let i = 0; i < data.items.length; i++) {
                    body =
                        body.addChild('tr', {'class': 'hikasu-updates-page_tables-element-id-' + data.items[i].project_id})
                            .add('td', {}, data.items[i].title)
                            .add('td', {}, data.items[i].version)
                            .add('td', {}, data.items[i].version_last)
                            .addChild('td')
                            .add('button', {
                                'class': 'btn', 'events': [
                                    [
                                        'click',
                                        function (ev) {
                                            self.ajax(self.url + '&method=project&project_id=' + data.items[i].project_id, function (json) {
                                                let item = JSON.parse(json.data);
                                                let element = document.querySelector('.hikasu-updates-page_tables-element-id-' + data.items[i].project_id);
                                                let btn = element.querySelector('.btn');

                                                if (btn !== null) {
                                                    btn.setAttribute('disabled', 'disabled');
                                                    btn.innerHTML = HikasuLangs.updating;
                                                }

                                                self.installProject(item, false, false, function (data, messages) {
                                                    element.remove();
                                                    self.checkUpdates();
                                                }, function () {
                                                    if (btn !== null) {
                                                        btn.removeAttribute('disabled');
                                                        btn.innerHTML = HikasuLangs.update;
                                                    }
                                                });

                                            });
                                        }
                                    ]
                                ]
                            }, 'Обновить')
                            .getParent()
                            .getParent()
                }

                body = body.getParent().getParent();
            } else {
                body = body.add('div', {'class': 'hikasu-updates-empty'}, HikasuLangs.no_updates)
            }

            header = header.build();
            body = body.build();

            HikasuUtils.modal(header, body);

        });
    },

    showInstalled: function () {
        let self = this;
        self.ajax(self.url + '&method=installedList', function (response) {
            let data = response.data[0];
            let header = HikasuUtils.createElement('h2', {'class': ''}, HikasuLangs.extension_installed);
            let body = HikasuUtils.createElement('div', {'class': 'hikasu-installed-page'});

            if (data.length > 0) {
                body =
                    body.addChild('table', {'class': 'hikasu-installed-page_tables table table-striped table-hover'})
                        .addChild('thead')
                        .addChild('tr')
                        .add('th', {}, HikasuLangs.extension_name)
                        .add('th', {}, HikasuLangs.current_version)
                        .add('th', {}, '')
                        .getParent()
                        .getParent()
                        .addChild('tbody')

                for (let i = 0; i < data.length; i++) {
                    body =
                        body.addChild('tr', {'class': 'hikasu-installed-page_tables-element-id-' + data[i].project_id})
                            .add('td', {}, data[i].title)
                            .add('td', {}, data[i].version)
                            .addChild('td', {'class': 'hikasu-installed-page_buttons'})
                            .add('button', {
                                'class': 'btn btn-width-fixed', 'events': [
                                    [
                                        'click',
                                        function (ev) {
                                            self.showProject(data[i].project_id);
                                            ev.preventDefault();
                                        }
                                    ]
                                ]
                            }, HikasuLangs.button_view)
                            .add('button', {
                                'class': 'btn btn-width-fixed ' + (parseInt(data[i].enable) ? 'btn-danger' : 'btn-success'),
                                'events': [
                                    [
                                        'click',
                                        function (ev) {
                                            let button = this;
                                            button.setAttribute('disabled', 'disabled');

                                            self.ajax(self.url + '&method=installedList', function (json) {

                                                button.removeAttribute('disabled');
                                            }, function () {
                                                button.removeAttribute('disabled');
                                            });
                                        }
                                    ]
                                ]
                            }, parseInt(data[i].enable) ? HikasuLangs.button_disable : HikasuLangs.button_enable)
                            .add('button', {
                                'class': 'btn btn-danger', 'events': [
                                    [
                                        'click',
                                        function (ev) {

                                        }
                                    ]
                                ]
                            }, '<span class="icon-trash"></span>')
                            .getParent()
                            .getParent()
                }

                body = body.getParent().getParent();
            } else {
                body = body.add('div', {'class': 'hikasu-installed-empty'}, HikasuLangs.no_installed)
            }

            header = header.build();
            body = body.build();

            HikasuUtils.modal(header, body);

        });
    },

    ajax: function (url, callback_success, callback_fail) {
        let req = new XMLHttpRequest(),
            self = this;

        req.open("POST", url, true);
        req.onload = function (ev) {

            if (req.status === 200) {
                let json = JSON.parse(req.responseText);
                if (callback_success !== null) {
                    callback_success(json);
                }
            } else {
                if (callback_fail !== null) {
                    callback_fail();
                }
            }

        };
        req.send();
    },

    loaderInit: function () {
        let self = this;
        let loader = HikasuUtils.createElement('div', {'class': 'hikasu-loader hide'})
            .add('img', {'src': '/media/plg_installer_hikasu/img/loader.svg'});
        self.container.appendChild(loader.build());
    },

    loaderShow: function () {
        let loader = document.querySelector('.hikasu-loader');
        if (loader !== null) {
            loader.classList.remove('hide');
        }
    },

    loaderHide: function () {
        let loader = document.querySelector('.hikasu-loader');
        if (loader !== null) {
            loader.classList.add('hide');
        }
    }

}