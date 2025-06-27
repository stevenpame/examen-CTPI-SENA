document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const userGreeting = document.getElementById('user-greeting');
    const logoutButton = document.getElementById('logout-button');
    const fichaSelect = document.getElementById('ficha-select');
    const searchInput = document.getElementById('search-input'); 
    const aprendicesTableBody = document.getElementById('aprendices-table-body');
    const detalleCodigo = document.getElementById('detalle-codigo');
    const detallePrograma = document.getElementById('detalle-programa');
    const detalleNivel = document.getElementById('detalle-nivel');
    const detalleEstado = document.getElementById('detalle-estado');

    
    const VALID_PASSWORD = "adso2993013";
    const API_URL = "https://raw.githubusercontent.com/CesarMCuellarCha/apis/refs/heads/main/SENA-CTPI.matriculados.json";

    let allAprendicesData = [];

   
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;

        
        if (password === VALID_PASSWORD) {
            localStorage.setItem('loggedInUser', username); 
            loginError.textContent = '';
            showApp();
        } else {
            loginError.textContent = 'Contraseña incorrecta.'; 
        }
    });

    
    logoutButton.addEventListener('click', () => {
        localStorage.clear();
        hideApp();
    });

    
    function showApp() {
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        const user = localStorage.getItem('loggedInUser');
        if (user) {
            userGreeting.textContent = `Bienvenido, ${user}!`;
        }
        fetchDataAndRenderTable();
        loadStoredFichaDetails();
    }

    function hideApp() {
        loginContainer.style.display = 'block';
        appContainer.style.display = 'none';
        usernameInput.value = '';
        passwordInput.value = '';
        aprendicesTableBody.innerHTML = '';
        clearFichaDetails();
        fichaSelect.innerHTML = '<option value="">-- Todas las Fichas --</option>';
        if (searchInput) searchInput.value = ''; 
    }

    
    async function fetchDataAndRenderTable() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error HTTP! estado: ${response.status}`);
            }
            allAprendicesData = await response.json();
            renderFichaOptions(allAprendicesData);
            filterAndRenderTable(); 
        } catch (error) {
            console.error('Error al obtener los datos:', error);
            aprendicesTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error al cargar los datos: ${error.message}</td></tr>`;
        }
    }

    
    function renderFichaOptions(data) {
        const uniqueFichasMap = new Map();
        data.forEach(item => {
            if (!uniqueFichasMap.has(item.FICHA)) {
                uniqueFichasMap.set(item.FICHA, {
                    codigo: item.FICHA,
                    programa: item.PROGRAMA,
                    nivel: item.NIVEL_DE_FORMACION,
                    estado: item.ESTADO_FICHA
                });
            }
        });

        fichaSelect.innerHTML = '<option value="">-- Todas las Fichas --</option>';
        uniqueFichasMap.forEach(ficha => {
            fichaSelect.innerHTML += `<option value='${JSON.stringify(ficha)}'>${ficha.codigo} - ${ficha.programa}</option>`;
        });
    }

    
    function renderTabla(dataToRender) {
        aprendicesTableBody.innerHTML = '';
        if (dataToRender.length === 0) {
            aprendicesTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay aprendices para mostrar.</td></tr>';
            return;
        }

        dataToRender.forEach(aprendiz => {
            const fila = document.createElement('tr');

           
            if (aprendiz.ESTADO_APRENDIZ === "Retiro voluntario") {
                fila.style.color = 'red';
                fila.style.fontWeight = 'bold';
                fila.style.backgroundColor = '#ffcccc';
            }

            fila.innerHTML = `
                <td>${aprendiz.FICHA}</td>
                <td>${aprendiz.PROGRAMA}</td>
                <td>${aprendiz.NIVEL_DE_FORMACION}</td>
                <td>${aprendiz.ESTADO_FICHA}</td>
                <td>${aprendiz.NUMERO_DOCUMENTO}</td>
                <td>${aprendiz.NOMBRE} ${aprendiz.PRIMER_APELLIDO} ${aprendiz.SEGUNDO_APELLIDO || ''}</td>
                <td>${aprendiz.ESTADO_APRENDIZ}</td>
            `;
            aprendicesTableBody.appendChild(fila);
        });
    }

    
    function filterAndRenderTable() {
        let filteredData = [...allAprendicesData]; 

        
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : ''; 
        if (searchTerm) {
            filteredData = filteredData.filter(aprendiz => {
                const fullName = `${aprendiz.NOMBRE} ${aprendiz.PRIMER_APELLIDO} ${aprendiz.SEGUNDO_APELLIDO || ''}`.toLowerCase();
                const fichaCode = String(aprendiz.FICHA).toLowerCase();
                const programName = aprendiz.PROGRAMA.toLowerCase();
                const documentNumber = String(aprendiz.NUMERO_DOCUMENTO).toLowerCase();
                const apprenticeStatus = aprendiz.ESTADO_APRENDIZ.toLowerCase();

                return fullName.includes(searchTerm) ||
                       fichaCode.includes(searchTerm) ||
                       programName.includes(searchTerm) ||
                       documentNumber.includes(searchTerm) ||
                       apprenticeStatus.includes(searchTerm);
            });
        }

        
        const selectedFichaValue = fichaSelect.value;
        if (selectedFichaValue) {
            try {
                const fichaData = JSON.parse(selectedFichaValue);
                filteredData = filteredData.filter(a => a.FICHA === fichaData.codigo);

                localStorage.setItem("selectedFichaCodigo", fichaData.codigo);
                localStorage.setItem("selectedFichaPrograma", fichaData.programa);
                localStorage.setItem("selectedFichaNivel", fichaData.nivel);
                localStorage.setItem("selectedFichaEstado", fichaData.estado);
                loadStoredFichaDetails();
            } catch (e) {
                console.error("Error al parsear los datos de la ficha seleccionada:", e);
                clearFichaDetails();
                localStorage.removeItem('selectedFichaCodigo');
                localStorage.removeItem('selectedFichaPrograma');
                localStorage.removeItem('selectedFichaNivel');
                localStorage.removeItem('selectedFichaEstado');
            }
        } else {
            clearFichaDetails();
            localStorage.removeItem('selectedFichaCodigo');
            localStorage.removeItem('selectedFichaPrograma');
            localStorage.removeItem('selectedFichaNivel');
            localStorage.removeItem('selectedFichaEstado');
        }

        renderTabla(filteredData);
    }

    
    fichaSelect.addEventListener('change', filterAndRenderTable);
    if (searchInput) searchInput.addEventListener('input', filterAndRenderTable); 

    
    function loadStoredFichaDetails() {
        detalleCodigo.textContent = localStorage.getItem('selectedFichaCodigo') || 'N/A';
        detallePrograma.textContent = localStorage.getItem('selectedFichaPrograma') || 'N/A';
        detalleNivel.textContent = localStorage.getItem('selectedFichaNivel') || 'N/A';
        detalleEstado.textContent = localStorage.getItem('selectedFichaEstado') || 'N/A';
    }

    
    function clearFichaDetails() {
        detalleCodigo.textContent = 'N/A';
        detallePrograma.textContent = 'N/A';
        detalleNivel.textContent = 'N/A';
        detalleEstado.textContent = 'N/A';
    }

    
    if (localStorage.getItem("loggedInUser")) {
        showApp();
    } else {
        hideApp();
    }
});