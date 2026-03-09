import Invoices from './Invoices'

export default function UnpaidInvoices() {
  return <Invoices defaultFilter={{ status: 'pending' }} pageTitle="Tagihan Belum Lunas (Unpaid Invoice)" />
}
