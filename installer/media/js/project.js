window.SovmartProject = {

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

            SovmartUtils.ajaxGet(Sovmart.url + '&method=install&id=' + args.ids[i])
                .done(function (response) {

                    ids_current++;
                    responses.push(response);

                    if(
                        flag_break === false &&
                        ids_current === ids_count &&
                        typeof args.success === 'function'
                    ) {
                        try {
                            args.success(responses);
                        }
                        catch (e) {
                            if(
                                flag_break &&
                                typeof args.fail === 'function'
                            ) {
                                args.fail(responses);
                            }
                        }
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

        let is_delete = confirm(SovmartLangs.text_question_delete);

        if (!is_delete) {

            if (typeof args.cancel === 'function') {
                args.cancel(args.id);
            }

            return;
        }


        SovmartUtils.ajaxGet(Sovmart.url + '&method=delete&id=' + args.id)
            .done(function (response) {
                let data = JSON.parse(response.data);

                if (typeof args.success === 'function') {
                    try {
                        args.success(data, args.id);
                    }
                    catch (e) {
                        if (typeof args.fail === 'function') {
                            args.fail(args.id);
                        }
                    }
                }

            })
            .fail(function () {

                if (typeof args.fail === 'function') {
                    args.fail(args.id);
                }

            });

    },

    checkInstall: function (args) {
        SovmartUtils.ajaxGet(Sovmart.url + '&method=checkinstall&list=' + JSON.stringify(args.ids))
            .done( function (json) {
                let find = json.data[0];

                SovmartUtils.ajaxGet(Sovmart.url + '&method=checkUpdates')
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
        SovmartUtils.ajaxGet(Sovmart.url + '&method=checkupdates')
            .done( function (response) {
                let data = JSON.parse(response.data);

                if (typeof args.done === 'function') {
                    args.done(data);
                }
            });
    },

    sync: function (args) {
        SovmartUtils.ajaxGet(Sovmart.url + '&method=sync')
            .done(function (json) {
                let count = json.data;

                SovmartUtils.createAlert(SovmartLangs.text_sync + count, 'info', 5000);

                if(typeof args.done === 'function') {
                    args.done();
                }
            })
            .fail(function (xhr) {
                let data = JSON.parse(xhr.responseText);
                SovmartUtils.createAlert(data.data, 'danger', 5000);

                if(typeof args.fail === 'function') {
                    args.fail();
                }
            });
    }

};