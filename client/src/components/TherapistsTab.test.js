import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TherapistsTab from './TherapistsTab';
import ErrorBoundary from './ErrorBoundary';
import { therapistAPI } from '../services/api';

jest.mock('../services/api', () => ({
  therapistAPI: {
    getAll: jest.fn(),
    getHidden: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    checkHasAccount: jest.fn(),
    hide: jest.fn(),
    deleteCompletely: jest.fn(),
  },
  API_ROOT: 'http://localhost:3001',
}));

const mockTherapists = [
  {
    id: 1,
    full_name: 'Anna Becerra',
    label: 'Directora y Psicóloga Sanitaria',
    bio: 'Bio de Anna Becerra',
    experience: 7,
    specializations: ['Depresión', 'EMDR'],
    languages: ['Catalán', 'Español'],
    session_types: ['Individual', 'Pareja'],
    license_number: '12345',
    calendar_color_id: '11',
    calendar_alias: 'anna',
    photo: null,
    education: [{ degree: 'Máster en Psicología', university: 'UAB', year: null }]
  },
  {
    id: 2,
    full_name: 'Lucía Gómez',
    label: 'Psicóloga Sanitaria y EMDR',
    bio: 'Bio de Lucía Gómez',
    experience: 8,
    specializations: ['Ansiedad'],
    languages: ['Catalán', 'Español'],
    session_types: ['Individual'],
    license_number: '67890',
    calendar_color_id: '2',
    calendar_alias: 'lucia',
    photo: null,
    education: []
  }
];

const mockHiddenTherapists = [
  { id: 16, full_name: 'Terapeuta Oculto Test', photo: null, bio: 'Bio oculta' }
];

describe('Flujo de Gestión de Terapeutas en Admin', () => {
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    therapistAPI.getHidden.mockResolvedValue({ data: mockHiddenTherapists });
  });

  test('1. Entrar en Admin -> Terapeutas sin error (ErrorBoundary no salta)', () => {
    render(
      <ErrorBoundary>
        <TherapistsTab therapists={mockTherapists} onRefresh={mockRefresh} />
      </ErrorBoundary>
    );

    expect(screen.queryByText(/Ha ocurrido un error al cargar esta sección/i)).not.toBeInTheDocument();
    expect(screen.getByText('👨‍⚕️ Gestión de Terapeutas')).toBeInTheDocument();
  });

  test('2. Comprobar que carga la lista existente de terapeutas', () => {
    render(
      <ErrorBoundary>
        <TherapistsTab therapists={mockTherapists} onRefresh={mockRefresh} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Anna Becerra')).toBeInTheDocument();
    expect(screen.getByText('Directora y Psicóloga Sanitaria')).toBeInTheDocument();
    expect(screen.getByText('7 años de experiencia')).toBeInTheDocument();
    expect(screen.getByText('Depresión, EMDR')).toBeInTheDocument();

    expect(screen.getByText('Lucía Gómez')).toBeInTheDocument();
    expect(screen.getByText('8 años de experiencia')).toBeInTheDocument();
  });

  test('3. Abrir "Añadir terapeuta"', async () => {
    render(
      <ErrorBoundary>
        <TherapistsTab therapists={mockTherapists} onRefresh={mockRefresh} />
      </ErrorBoundary>
    );

    const addBtn = screen.getByRole('button', { name: /Añadir Terapeuta/i });
    await act(async () => {
      fireEvent.click(addBtn);
    });

    expect(screen.getByText('➕ Añadir Terapeuta')).toBeInTheDocument();
    expect(screen.getByText('Nombre Completo *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear Terapeuta/i })).toBeInTheDocument();
  });

  test('4. Abrir edición de un terapeuta existente con sus datos precargados', () => {
    render(
      <ErrorBoundary>
        <TherapistsTab therapists={mockTherapists} onRefresh={mockRefresh} />
      </ErrorBoundary>
    );

    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(editButtons[0]); // Editar Anna Becerra

    expect(screen.getByText('✏️ Editar Terapeuta')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Anna Becerra')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Directora y Psicóloga Sanitaria')).toBeInTheDocument();
    expect(screen.getByDisplayValue('7')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Depresión, EMDR')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar Cambios/i })).toBeInTheDocument();
  });

  test('5. Cancelar edición y volver a abrir el formulario en modo nuevo', async () => {
    render(
      <ErrorBoundary>
        <TherapistsTab therapists={mockTherapists} onRefresh={mockRefresh} />
      </ErrorBoundary>
    );

    // Abrir edición
    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('✏️ Editar Terapeuta')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Anna Becerra')).toBeInTheDocument();

    // Cancelar edición
    const cancelBtn = screen.getByRole('button', { name: /Volver a la lista/i });
    fireEvent.click(cancelBtn);

    // Debe volver al listado
    expect(screen.getByText('👨‍⚕️ Gestión de Terapeutas')).toBeInTheDocument();
    expect(screen.queryByText('✏️ Editar Terapeuta')).not.toBeInTheDocument();

    // Volver a abrir el formulario
    const addBtn = screen.getByRole('button', { name: /Añadir Terapeuta/i });
    await act(async () => {
      fireEvent.click(addBtn);
    });

    // Debe ser modo añadir y los campos deben estar vacíos
    expect(screen.getByText('➕ Añadir Terapeuta')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Anna Becerra')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear Terapeuta/i })).toBeInTheDocument();
  });

  test('6. Confirmar que la petición de terapeutas ocultos funciona al abrir el formulario', async () => {
    render(
      <ErrorBoundary>
        <TherapistsTab therapists={mockTherapists} onRefresh={mockRefresh} />
      </ErrorBoundary>
    );

    const addBtn = screen.getByRole('button', { name: /Añadir Terapeuta/i });
    await act(async () => {
      fireEvent.click(addBtn);
    });

    // Verifica que se llamó a la API de terapeutas ocultos
    expect(therapistAPI.getHidden).toHaveBeenCalledTimes(1);

    // Espera a que se renderice el selector con los terapeutas de facturación
    await waitFor(() => {
      expect(screen.getByText('¿Qué quieres hacer?')).toBeInTheDocument();
      expect(screen.getByText(/Activar terapeuta de facturación/i)).toBeInTheDocument();
    });

    // Seleccionar la opción de activar existente
    const radioExisting = screen.getByLabelText(/Activar terapeuta de facturación/i);
    fireEvent.click(radioExisting);

    // Verificar que aparece la lista desplegable con el terapeuta oculto
    expect(screen.getByText('Selecciona terapeuta:')).toBeInTheDocument();
    expect(screen.getByText('Terapeuta Oculto Test')).toBeInTheDocument();
  });
});
