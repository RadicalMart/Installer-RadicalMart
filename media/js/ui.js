window.RadicalInstallerUI = {

    container: null,
    container_page: null,
    container_toolbar: null,
    container_form_key: null,
    container_loader: null,


    loaderShow: function (args) {
        let loader = RadicalInstallerUtils.createElement('div', {}, this.renderLoader()).build();
        args.container.append(loader);
        let promise = new Promise(args.wait);

        promise.then(
                result => {
                    loader.remove();
                },
                error => {
                    loader.remove();
                }
            );

        return promise;
    },


    showPage: function (args) {

        if(args.buttons !== undefined) {
            this.container_toolbar.innerHTML = '';
            this.container_toolbar.appendChild(this.renderToolbar(args.buttons));
        }

        if(args.page !== undefined) {
            this.container_page.innerHTML = '';
            this.container_page.appendChild(args.page);
        }

    },


    renderToolbar: function (buttons) {
        let toolbar = RadicalInstallerUtils.createElement('div', {class: 'radicalinstaller-toolbar ri-btn-group'});

        for(let k in buttons) {
            toolbar.add('button', {'type': 'button', 'events': buttons[k].events, 'class': buttons[k].class}, buttons[k].label);
        }

        return toolbar.build();
    },


    renderPage: function (args) {
        let page = RadicalInstallerUtils.createElement('div', {class: 'radicalinstaller-page'});
        return page.build();
    },


    renderGroup: function (args) {
        let group = RadicalInstallerUtils
            .createElement('div', {class: 'radicalinstaller-group'})
            .addChild('div', {class: 'radicalinstaller-group-header radicalinstaller-flex radicalinstaller-flex-middle radicalinstaller-margin-bottom'})
                .addChild('div', {class: 'radicalinstaller-width-auto radicalinstaller-margin-right'})
                    .add('h3', {}, args.label)
                    .getParent();


        if(args.buttons !== undefined) {
            group = group.addChild('div', {class: 'radicalinstaller-width-expand'});

            for(let k in args.buttons) {
                group = group.add('button', {'type': 'button', 'events': args.buttons[k].events, class: args.buttons[k].class}, args.buttons[k].label);
            }

            group = group.getParent();
        }

        group = group.getParent();
        group = group.add('div', {class: 'radicalinstaller-group-content'}, args.content);

        return group.build();
    },


    renderFormKey: function () {
        let self = this,
            form = RadicalInstallerUtils.createElement('div');
            form = form
            .addChild('div')
                .addChild('div', {'class': 'radicalinstaller-width-1-1'})
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

                                            self.syncExtensions(function(){
                                            }, function() {
                                            });

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
                        .addChild('div', {'class': 'radicalinstaller-card radicalinstaller-background-muted radicalinstaller-padding'})
                            .addChild('div', {'class': 'control-group control-group-no-label control-group-large'})
                                .addChild('div', {'class': 'controls'})
                                    .add('input', {'class': 'radicalinstaller-width-1-1', 'type': 'text', 'placeholder': RadicalInstallerLangs.text_input_key, 'name': 'key'})
                                    .getParent()
                                .getParent()
                                .addChild('div', {'class': 'control-group control-group-no-label control-group-large'})
                                    .addChild('div', {'class': 'controls'})
                                        .add('button', {'class': 'ri-btn ri-btn-default ri-btn-primary ri-btn-large', 'type': 'submit'}, RadicalInstallerLangs.button_submit)
                                        .getParent()
                                    .getParent()
                                .getParent()
                            .getParent()
                        .getParent()


        return form.build();
    },


    renderProjectGrid: function (args) {
        let grid = RadicalInstallerUtils.createElement('div'),
            current = 0,
            width = 4,
            close = false;

        grid = grid.addChild('div', {class: 'radicalinstaller-grid radicalinstaller-grid-width-1-' + width});

        for(let i=0;i<args.items.length;i++) {
            current++;
            close = false;
            grid = grid.add('div', {}, args.items[i]);

            if (current >= width) {
                grid = grid.getParent();
                grid = grid.add('div', {class: 'radicalinstaller-logs'});
                grid = grid.addChild('div', {class: 'radicalinstaller-grid radicalinstaller-grid-width-1-' + width});
                current = 0;
                close = true;
            }

        }

        grid = grid.getParent();

        if(!close) {
            grid = grid.add('div', {class: 'radicalinstaller-logs'});
        }

        return grid.build();
    },


    renderProjectCard: function (args) {
        let self = this;
        let cover = '';

        if(args.images !== undefined && args.images.cover !== false) {
            cover = RadicalInstaller.api + '/' + args.images.cover
        }

        let card = RadicalInstallerUtils
                .createElement('div', {class: 'radicalinstaller-project-card'})
                .addChild('div', {class: 'radicalinstaller-project-card-image'});

                if(cover !== '') {
                    card.add('img', {src: cover})
                }

        card = card.getParent()
                .addChild('div', {class: 'radicalinstaller-project-card-info'})
                    .add('h4', {}, args.title)
                    .add('div', {}, 'Категория')
                    .add('div', {}, 'Версия')
                    .addChild('div', {class: 'ri-btn-group ri-btn-group-small'})
                        .add('button', {type: 'button', class: 'ri-btn ri-btn-success'}, 'Установить')
                        .add('button', {type: 'button', class: 'ri-btn ri-btn-danger'}, 'Удалить')
                        .add('button', {type: 'button', class: 'ri-btn ri-btn-default'}, '?')
                        .getParent()
                    .getParent()

        return card.build();
    },


    renderAlert: function (args) {
        return '';
    },


    renderLoader: function () {
        let self = this;

        return RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-loader'})
                .add('img', {'src': RadicalInstaller.assets + '/img/loader.svg'}).build();

    }

};