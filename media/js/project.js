window.RadicalInstallerProject = {

    install: function (args) {
        let ids_count = args.ids.length,
            ids_current = 0,
            responses = [],
            flag_break = false;

        for (let i = 0; i < ids_count; i++) {

            if (typeof args.wait === 'function') {
                args.wait(args.ids[i]);
            }

            if(flag_break) {
                break;
            }

            RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=install&id=' + args.ids[i])
                .done(function (response) {

                    ids_current++;
                    responses.push(response);

                    if(
                        flag_break === false &&
                        ids_current === ids_count &&
                        typeof args.success === 'function'
                    ) {
                        args.success(responses);
                    }

                    if(
                        flag_break &&
                        typeof args.fail === 'function'
                    ) {
                        args.fail(responses);
                    }

                })
                .fail(function (response) {

                    ids_current++;
                    flag_break = true;

                    responses.push(response);

                    if(
                        flag_break &&
                        typeof args.fail === 'function'
                    ) {
                        args.fail(responses);
                    }

                });
        }

    },


    update: function (args) {
        return this.install(args);
    },


    delete: function (args) {

        let is_delete = confirm(RadicalInstallerLangs.text_question_delete);

        if (!is_delete) {
            return;
        }


        RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=delete&id=' + args.id)
            .done(function (response) {
                let data = JSON.parse(response.data);

                if (typeof args.success === 'function') {
                    args.success(data, args.id);
                }

            })
            .fail(function () {

                if (typeof args.fail === 'function') {
                    args.fail(args.id);
                }

            });

    },


    checkInstall: function (args) {
        RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=checkInstall&list=' + JSON.stringify(args.ids))
            .done( function (json) {
                let find = json.data[0];

                RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=checkUpdates')
                    .done( function (response) {
                        let data = JSON.parse(response.data);

                        for(let i=0;i<find.length;i++) {
                            find[i] = parseInt(find[i]);
                        }

                        for(let i=0;i<args.ids.length;i++) {
                            args.ids[i] = parseInt(args.ids[i]);
                        }

                        if (typeof args.done === 'function') {
                            args.done(find, args.ids, data);
                        }
                    });
            });
    },


    checkUpdate: function (args) {
        RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=checkUpdates')
            .done( function (response) {
                let data = JSON.parse(response.data);

                if (typeof args.done === 'function') {
                    args.done(data);
                }
            });
    },


    sync: function (args) {
        RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=syncExtensions')
            .done(function (json) {
                let count = json.data;

                RadicalInstallerUtils.createAlert(RadicalInstallerLangs.text_sync + count, 'info', 5000);

                if(typeof args.done === 'function') {
                    args.done();
                }
            })
            .fail(function (xhr) {
                let data = JSON.parse(xhr.responseText);
                RadicalInstallerUtils.createAlert(data.data, 'danger', 5000);

                if(typeof args.fail === 'function') {
                    args.fail();
                }
            });
    }

};