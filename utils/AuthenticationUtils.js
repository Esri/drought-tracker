/*
 Copyright 2017 Esri

 Licensed under the Apache License, Version 2.0 (the "License");

 you may not use this file except in compliance with the License.

 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software

 distributed under the License is distributed on an "AS IS" BASIS,

 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

 See the License for the specific language governing permissions and

 limitations under the License.​
 */
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
