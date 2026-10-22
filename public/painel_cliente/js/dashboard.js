function configurarUsuario() {
    const nome = (localStorage.getItem('NOME_USUARIO') || '').trim() || 'Usuário BioTrace';
    const email = (localStorage.getItem('EMAIL_USUARIO') || 'usuario@biotrace.com');
    const partes = nome.split(/\s+/).filter(Boolean);
    const iniciais = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : (partes[0] || 'BT').slice(0, 2);
    document.getElementById('nome_cliente').textContent = nome;
    document.getElementById('email_cliente').textContent = email;
    document.getElementById('usuario_avatar').textContent = iniciais.toUpperCase();
}

function configurarSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuButton = document.getElementById('menuButton');

    const fechar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        menuButton.setAttribute('aria-expanded', 'false');
    }

    menuButton.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        menuButton.setAttribute('aria-expanded', 'true');
    });
    
    document.getElementById('sidebarClose').addEventListener('click', fechar);

    overlay.addEventListener('click', fechar);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            fechar();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    configurarUsuario();
    configurarSidebar();
});
