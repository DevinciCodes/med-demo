🔀 Git Workflow (Team Standard)


```
cd client
npm run dev
```
new terminal

```
cd server
npm run dev
```
Always pull latest changes before starting work:
```
git checkout main
git pull origin main
```
Create a feature branch:
```
git checkout -b your-feature-branch
```
Make changes → add → commit:
```
git add .
git commit -m "Describe your changes here"
```
Push branch to GitHub:
```
git push origin your-feature-branch
```
Open a Pull Request (PR) on GitHub
Go to the repo on GitHub.
Compare & create PR into main.
Wait for approval and merge.
After merging:
```
git checkout main
git pull origin main
git branch -d your-feature-branch              # delete local branch
git push origin --delete your-feature-branch   # delete remote branch
```




1. To run
you will need to navigate to server and client in 2 seperate terminals

run 
```
npm install

```
in each client and server

2. You will then need to create a keys folder inside server folder and create a file called serviceAccount.json and copy and paste this into there

```
{
  "type": "service_account",
  "project_id": "pillars-e65ea",
  "private_key_id": "3e35f0e9f0d153c83bff264c265ddf0c5c55fc56",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDiSr4QnHYPjENF\nXHauD9VrdbrBHMWvLKGTda0bQiaPYoczRXPZ1qn3Sbj1grxpcpYY2ejVX7UNVKpX\n1hyXY/YsLHZxf/EMC5X1micLT4sP4LOA9N+9Lbz7FR5dWQAVWdazSYomJoLBvTbu\nz/XZUbqB3bDfbEoNrUy145b7Q41Pz0AWLuVowQBuhnTTLVNrkMaYcCTBHK3e+5dc\nSJlpfQ2ylRaxke+mA85lf2/pHQvLJJx46BXvigPcqb2QobxydO+sqDIwLKGXAR5r\nc0iHMHGjjypkGwgvcfpbVAvZ0AS0Y+98OXESECmgNqCZ+uCcU1VNEceoCgQmgJ63\nPtYsDKG1AgMBAAECggEAAaPfCsnHhUdT+X25Envk5Rl+WAX4XNOq/CGfNpJdKy7g\noft/4nVO2A79uzHOYclF0zpJGLrP2h/h+C8CGArObvWHij0OJzMyTAxo+gkCjgPn\n6ShdMsbRFtTJWo3ZlU4IY1ZGHQ6sZfEUI9j4BDI2ctiDfqsPQlgeNTdIEdwkew6W\n//d6pvt9Oz5vztge99PL5m90Uqe9Pu2D03ZTlbevy6jJD2TzOUUvVt3YiX6JD7u2\nKdtzXCdnn+MfDZ2iWq9a3bhO49FmsICiDt10fHRswgj73XURMmNPN8urJJe89abo\nr7MHKigTzxcBKR3LQlbTtoExHOY+/Pc6rsZU4PRqhQKBgQD1gxjph2xE0Lc1uTCE\nNebI/Kwxo3nUXOep7Yy9wpStqYqyXw5+0l5nQCgiz+HK81NlmAgXGNyEVi8WZULX\ngZsjqt47YhqZ+qP9oUGMvHqIiN5cnWVfTLx0rnQtfoM/0Z/w6n0tFiuWO7gmGZLy\nIpXLy6MGZh0xo2Lb5pCueITDJwKBgQDr9XSBSll32lm6XnjeU/jS6BrZueW7gar3\nJVrSd1WBQ3kG/NC3T2I+snIH7hOcUb3eLzr1470/O7PQRWicjMNnLvdyJ+rzuMER\n+ERoTbkHk43Td4VXQl5s071oua4FWWem7pacz5GYsSAHGgfL6UGNGXeVjbkk22Lv\ni6/1bMUNwwKBgFn8jCQEW/25Fn3de9fpvcZLPn4PMjdROiRBioV/DWm9q7WHO9Pm\nHW3wyQVBdrwhhZ7GI6j7ls/2mtm1kdNVkNx4422WnrNzd6od8d24s5zZtc7ybdaJ\nVMXbr3+BUHAS0HHIMMtWxfERwIROeVrArHD/GajdwrOP9EsvbjZUvCyfAoGBAM16\nV7WLeHP9yquYP2tk9sc7Zr55u0xZM/e7KOclEmnZxxhFqsAnOifdH542Pg+fw1cs\nDA07AH+DTygseVfy4OsHJGbdyiXpmwA6EeA+5sVpQlWHvK9rVW0xyrzbDWcNH01o\ncfImc+TjQj/M9EMnYnUsW036N+OXxQVTwKxZxxQfAoGBAI8/7OTHW9kEttIEygCZ\nYCu6xxQclwZE+Fu1QaoaHmimRk5g5G5OeVLauRkNLMFwlpUnuQrnVE6j/YtDLY4Z\n0ixQ2445Qwy116xetbWnIMICev7jpKtna+ZS0DfEl5zkRFu8GnqmKZ2j7oUtyRqE\nFGDeGoydoz+ijcpTYSqXQn1W\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@pillars-e65ea.iam.gserviceaccount.com",
  "client_id": "115028081676143904989",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40pillars-e65ea.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}


```

3. Then create a .env inside server folder and paste this in there:  

```

GOOGLE_APPLICATION_CREDENTIALS=./keys/serviceAccount.json
OPENAI_API_KEY=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
FIREBASE_PROJECT_ID=pillars-e65ea


```

4. Then create a root .env outside of client and server folder and paste this in there

```

VITE_USE_AUTH_MOCK=true
OPENAI_API_KEY=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

```

5. You should then be able to run normal Git Workflow:

🔀 Git Workflow (Team Standard)


```
cd client
npm run dev
```
new terminal

```
cd server
npm run dev
```

7. Open [localhost](http://localhost:3000)

8. Signup as provider with institution 'MTSU'

9. then naviagete to http://localhost:3000/admin

10. sign in with creds

adminusername:admin@pillars.com
adminpassword:admindbms

and allow the provider you created

11. Then you will be able to sign in as provider and create patients and view patients.
The providers patients are tied together by instituion name, so all providers in the same institution can view all patients for that specific institution.

Creating a patient gives first a temp password the patient will need to signin for the first time, prompting them for their own individual passwrod reset.

Both providers and patients can add medications and run checks on the interactions if there are any.
