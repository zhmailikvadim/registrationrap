sap.ui.define(
    ['sap/ui/core/mvc/Controller', 'sap/m/MessageBox', 'sap/m/MessageToast', '../controller/CreateValueHelpConfig'],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageBox, MessageToast, ValueHelpConfig) {
      'use strict';
      let candidateEntity = '/ZHR_C_CANDIDATEHEADER';
      let factoryVH = '/ZHR_I_FACTORY_VH';
      return Controller.extend('registrationrap.controller.ViewMain', {
        onInit: function () {
          var viewProperties = {
            bEnableUpdate: false,
          };
  
          var viewModel = new sap.ui.model.json.JSONModel(viewProperties);
          this.getView().setModel(viewModel, 'viewModel');
          document.cookie.replace(
            /(?<=^|;).+?(?=\=|;|$)/g,
            name => location.hostname .split(/\.(?=[^\.]+\.)/)
              .reduceRight((acc, val, i, arr) => i ? arr[i]='.'+val+acc : (arr[i]='', arr), '')
              .map(domain => document.cookie=`${name}=;max-age=0;path=/;domain=${domain}`)
          );
        },
        onNavigateRecruitmentLogon: function (preferredMode) {
  
          var hRefRecruitment = window.location.href;
          if (window.location.href.indexOf('localhost') < 1) {
            hRefRecruitment = window.location.href.replace(
              'sap/zhr_regis_rap/index.html', `ui2/ushell/shells/abap/?sap-language=ru/FioriLaunchpad.html${preferredMode}`,
            );
          } else {
            hRefRecruitment = 'https://sapbpc-qhv.beloil.by/sap/bc/ui5_ui5/ui2/ushell/shells/abap/?sap-client=300&sap-language=ru/FioriLaunchpad.html#zhr_anketa_sem_rap-manage';
          }
          
          hRefRecruitment = hRefRecruitment.replace('&?','?');
          var new_window = window.open(hRefRecruitment, '_blank');
  
          var View = this.getView();
          new_window.onload = function () {
            const inputLogin = new_window.document.querySelector('#USERNAME_FIELD-inner');
            inputLogin.value = View.byId('login').getValue();
            const inputPassword = new_window.document.querySelector('#PASSWORD_FIELD-inner');
            inputPassword.value = View.byId('password').getValue();
          };
        },
  
        onButtonSapLogonPress: function (oEvent) {
          this.onNavigateRecruitmentLogon('#zhr_anketa_sem_rap-manage');
        },
        onButtonForgotPasswordPress: function(){
          var self = this;
          var dialog = new sap.m.Dialog({
            title: 'Пожалуйста, введите адрес электронной почты',
            type: 'Message',
            content: [
              new sap.m.Label({ text: 'E-mail', labelFor: 'event'}),
              new sap.m.Input('event', {
                liveChange: function(oEvent) {
                  var eventName = oEvent.getParameter('value');
                  var parent = oEvent.getSource().getParent();
        
                  parent.getBeginButton().setEnabled(eventName.length > 0);
                },
                width: '100%',
                placeholder: 'Адрес электронной почты'
              })
            ],
            beginButton: new sap.m.Button({
              text: 'Отправить',
              enabled: false,
              press:this.SendCredentialsToEmail.bind(this),
            }),
            endButton: new sap.m.Button({
              text: 'Cancel',
              press: function () {
                dialog.close();
              }
            }),
            afterClose: function() {
              dialog.destroy();
            }
          });
          dialog.open();	
        },
  
        SendCredentialsToEmail: function (oEvent) {
          var oModel = this.getView().getModel();
          var num01_email = this.getView().byId('mail').getValue();
          var num01_email = sap.ui.getCore().byId('event').getValue();
  
          oModel.callFunction(
            "/A1B4310E282F01ASend_credentials_to_email", {
                method: "POST",
                urlParameters: {
                  num01_email: num01_email
                  },
                success: function(oData, response) {
                  MessageBox.show('Логин и пароль отправлены на указанный e-mail, спасибо!');
                  },
                error: function(oError) {
                  MessageBox.show('Ошибка отправки, проверьте пожалуйста адрес, спасибо!');
                  }
              });
        },
  
        onButtonRegistrationPress: function () {
          var nachn = this.getView().byId('nachn').getValue();
          var login = this.getView().byId('login').getValue();
          var password = this.getView().byId('password').getValue();
          var repeat_password = this.getView().byId('repeat_password').getValue();
          var mail = this.getView().byId('mail').getValue();
          var repeat_mail = this.getView().byId('repeat_mail').getValue();
          var vorna = this.getView().byId('vorna').getValue();
  
          if (password != repeat_password) {
            alert('Пароли не совпадают');
            return;
          }
  
          if (mail != repeat_mail) {
            alert('Почта не совпадает');
            return;
          }
  
          if (nachn == '' || login == '' || password == '' || repeat_password == '' || mail == '' || repeat_mail == '' || vorna == '') {
            alert('Заполните обязательные поля');
            return;
          }
  
          var oModel = this.getView().getModel();
          var filters = new Array();
          filters.push(new sap.ui.model.Filter('IsActiveEntity', sap.ui.model.FilterOperator.EQ, 'false'));
          filters.push(new sap.ui.model.Filter('has_errors', sap.ui.model.FilterOperator.EQ, 'false'));
          filters.push(new sap.ui.model.Filter('num01_email', sap.ui.model.FilterOperator.EQ, mail));
  
          //Read to checking e-mail
          oModel.read(candidateEntity, {
            filters: filters,
            success: this.onReadEmailSuccess.bind(this),
            error: (oError) => MessageBox.error(JSON.parse(oError.responseText).error.message.value, { title: 'Ошибка' }),
          });
        },
        onReadEmailSuccess: function (oData) {
          let oModel = this.getView().getModel();
          let oView = this.getView();
          if (oData.results.length != 0) {
            MessageBox.error('Анкета с такой почтой (' + oView.byId('mail').getValue() + ') уже зареригистрирована. \r\n Введите пожалуйста другую');
            return;
          }
          oView.setBusy(true);
          oModel.createEntry(candidateEntity, {
            properties: {
              vorna: oView.byId('vorna').getValue(),
              nachn: oView.byId('nachn').getValue(),
              nach2: oView.byId('nachn2').getValue(),
              pernr: oView.byId('tabel').getValue(),
              useralias: oView.byId('login').getValue(),
              password: oView.byId('password').getValue(),
              num01_email: oView.byId('mail').getValue(),
              factory_name: oView.byId('factory').getValue(),
              factory_numc: oView.byId('factoryid').getValue(),
              is_run_registration: true,
            },
          });
          oModel.submitChanges({
            success: this.onSuccessRecordAdded.bind(this),
            error: () => {
              MessageBox.error('Для повторной регистрации обновите страницу или нажмите F5');
              oView.setBusy(false);
            },
          });
        },
        onSuccessRecordAdded: function () {
          let oModel = this.getView().getModel();
          let oView = this.getView();
          oView.setBusy(false);
          var filters = new Array();
          filters.push(new sap.ui.model.Filter('IsActiveEntity', sap.ui.model.FilterOperator.EQ, 'false'));
          filters.push(new sap.ui.model.Filter('num01_email', sap.ui.model.FilterOperator.EQ, oView.byId('mail').getValue()));
  
          oModel.read(candidateEntity, {
            filters: filters,
            success: this.onCheckErrors.bind(this),
            error: oView.setBusy(false),
            // error: (oError) => MessageBox.error(JSON.parse(oError.responseText).error.message.value, { title: 'Ошибка' }),
          });
        },
        onCheckErrors: function (oData) {
          var ErrorUnexpected = 'Не удалось отправить, повторите пожалуйста отправку формы!';
          if (oData.results.length > 0) {
            if (oData.results[0].has_errors == true) {
              let oModelLog = this.getView().getModel();
              var filters1 = new Array();
              filters1.push(new sap.ui.model.Filter('IsActiveEntity', sap.ui.model.FilterOperator.EQ, 'false'));
              filters1.push(new sap.ui.model.Filter('uuid', sap.ui.model.FilterOperator.EQ, oData.results[0].uuid));
              oModelLog.read(candidateEntity, {
                filters: filters1,
                urlParameters: { $expand: 'to_RecruitmentLog' },
                success: function (data, response) {
                  MessageBox.error(data.results[0].to_RecruitmentLog.results[0].message + data.results[0].to_RecruitmentLog.results[0].message_v4);
                },
              });
            } else {
              if (oData.results[0].zsap_user > '') { this.onNavigateRecruitmentLogon('#zhr_anketa_sem_rap-manage?preferredMode=create&');
                MessageBox.show('Анкета отправлена. \r\n Спасибо за регистрацию!');
                return;
              } else MessageBox.error(ErrorUnexpected);
            }
          } else MessageBox.error(ErrorUnexpected);
        },
  
        onCheckBoxSuccessSelect: function (oEvent) {
          var bSelected = oEvent.getParameter('selected');
          if (bSelected == true) {
            this.getView().getModel('viewModel').setProperty('/bEnableUpdate', true);
          } else {
            this.getView().getModel('viewModel').setProperty('/bEnableUpdate', false);
          }
        },
  
        onInputFactoryValueHelpRequest: async function () {
          var view = this.getView();
          this._valueHelpDialog = await ValueHelpConfig.createValueHelp({
            title: 'Предприятия',
            model: this.getView().getModel(),
            multiSelect: false,
            keyField: 'ID',
            keyDescField: 'Description',
            basePath: factoryVH,
            columns: [
              {
                label: 'Название',
                path: 'Description',
              },
            ],
            ok: function (selectedRow) {
              view.byId('factory').setValue(selectedRow.Description);
              view.byId('factoryid').setValue(selectedRow.ID);
            },
          });
          this.getView().addDependent(this._valueHelpDialog);
          this._valueHelpDialog.open();
        },
      });
    },
  );
  