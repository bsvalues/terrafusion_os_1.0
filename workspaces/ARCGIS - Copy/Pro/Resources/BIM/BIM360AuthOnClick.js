document.addEventListener('click', function (e)
{
  let rememberMe = document.getElementById('remember_me_hidden');

  if (rememberMe != null) {
    window.chrome.webview.postMessage(rememberMe.value);
  }
});
