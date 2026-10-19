b_usuario.innerHTML = `Olá, ${localStorage.NOME_USUARIO}`;

function limparSessao() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "/"
}