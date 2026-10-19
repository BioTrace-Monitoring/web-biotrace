function configurarUsuario() {
    const nome = (sessionStorage.getItem('NOME_USUARIO') || 'Usuário BioTrace').trim();
    const email = (sessionStorage.getItem('EMAIL_USUARIO') || 'usuario@biotrace.com');
    const partes = nome.split(/\s+/).filter(Boolean);
    const iniciais = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : (partes[0] || 'BT').slice(0, 2);
    document.getElementById('nome_cliente').textContent = nome;
    document.getElementById('email_cliente').textContent = email;
    document.getElementById('usuario_avatar').textContent = iniciais.toUpperCase();
}

function configurarSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    const fechar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    document.getElementById('menuButton').addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('active');
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