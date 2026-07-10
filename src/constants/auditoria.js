import {
  Truck, FileText, X, Trash2, StickyNote, ClipboardCheck
} from 'lucide-react';

export const ACCION_META = {
  estado:            { label: 'Cambio de estado', icon: Truck },
  referencias:       { label: 'PO / Orden',        icon: ClipboardCheck },
  notas:             { label: 'Notas internas',    icon: StickyNote },
  estimado:          { label: 'Estimado enviado',  icon: FileText },
  mensaje_eliminado: { label: 'Mensaje eliminado', icon: Trash2 },
  pedido_eliminado:  { label: 'Pedido eliminado',  icon: X },
};
