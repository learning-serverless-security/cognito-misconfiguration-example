const COGNITO_USER_POOL_ID = ''
const COGNITO_CLIENT_ID = '';
const COGNITO_IDENTITY_POOL_ID = '';
const AWS_REGION = '';
const SM_SECRET_ID = 'prod/secret1';

const poolData = {
    UserPoolId: COGNITO_USER_POOL_ID,
    ClientId: COGNITO_CLIENT_ID,
};

function displaySecrets() {
    AWS.config.credentials.refresh(function (err) {
        if (err) {
            console.error('Error refreshing credentials:', err);
            $('#result').text('Credentials error: ' + err.message);
        } else {
            console.log('AWS credentials refreshed');

            const secretsManager = new AWS.SecretsManager();

            secretsManager.getSecretValue({ SecretId: SM_SECRET_ID }, function (err, data) {
            if (err) {
                console.error('SecretsManager error:', err);
                $('#result').html('<div>SecretsManager error: ' + err.message + '</div>');
            } else {
                console.log('Secret:', data.SecretString);
                $('#result').html('<div>Secret loaded:\n' + data.SecretString + '</div>');
            }
            });
        }
    });
}

function authenticateCognitoUser(cognitoUser, authenticationDetails) {
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            alert('SUCCESSFULLY LOGGED IN!');
            $('#loginForm').hide();
            $('#result').show();

            const idToken = result.getIdToken().getJwtToken();

            $('#result').text('Login successful! ID token:\n' + idToken);
            console.log("ID Token:", idToken);

            AWS.config.region = AWS_REGION;
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
            Logins: {
                [`cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`]: idToken
            }
            });

            displaySecrets();
        },
        onFailure: function (err) {
            alert('FAILED SIGN IN ATTEMPT');
        }
    });
}
  
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  
$(document).ready(function () {
    $('#result').hide();

    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        const email = $('#email').val();
        const password = $('#password').val();

        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password,
        });

        const userData = { Username: email, Pool: userPool};
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        authenticateCognitoUser(cognitoUser, authenticationDetails);
    });
});