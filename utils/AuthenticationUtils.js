define([
    "config/config",
    "esri/arcgis/OAuthInfo",
    "esri/IdentityManager"
], function (Config, OAuthInfo, esriId) {

    "use strict";

    var registerOAuthConfig = function () {
        esriId.useSignInPage = false;
        var oauthConfig = new OAuthInfo({
            appId: Config.APP_ID,
            // Uncomment this line to prevent the user's signed in state from being shared
            // with other apps on the same domain with the same authNamespace value.
            //authNamespace: "portal_oauth_inline",
            portalUrl: Config.SHARING_HOST,
            popup: true,
            popupWindowFeatures: "height=480,width=800,location=no,resizable=no,scrollbars=no,status=no"
        });
        esriId.registerOAuthInfos([oauthConfig]);
        return oauthConfig;
    };

    return {
        registerOAuthConfig: registerOAuthConfig
    }
});