import { Button, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Layout from '@/components/Layout';
import { Apartment } from '@mui/icons-material';
import { useMemo } from 'react';
import { Box } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { nextClient } from '@/trpc';
import Container from '@/components/Container';
import { configurePage } from '@/components/page/Page';
import Loading from '@/components/page/Loading';
import { Tenant as PTenant, Invoice as PInvoice, Room as PRoom, Apartment as PApartment } from '@/types';
import dayjs from 'dayjs';
import z from 'zod';
import styles from '@/styles/Preview.module.scss';

type Apartment = PApartment;

type Room = PRoom & {
  apartment: Apartment;
};

type Tenant = Omit<PTenant, 'roomId' | 'room'> & {
  room: Room;
  invoices: PInvoice[];
};

type Invoice = {
  id: string;
  apartmentName: string;
  roomName: string;
  tenantName: string;
  rent: number;
  waterCharge: number;
  parkingFee: number;
  commonAreaCharge: number;
  sum: number;
};

type Props = {
  tenants: Tenant[];
};

const InvoiceComponent = ({ tenants }: Props) => {
  const invoices = useMemo<Invoice[]>(
    () =>
      tenants.map((tenant) => {
        const invoice = tenant.invoices[0] ?? undefined;
        const room = tenant.room;
        const apartment = tenant.room.apartment;
        const rent = invoice?.rent ?? tenant.rent ?? room.rent ?? apartment.rent ?? 0;
        const waterCharge =
          invoice?.waterCharge ?? tenant.waterCharge ?? room.waterCharge ?? apartment.waterCharge ?? 0;
        const parkingFee = tenant.parkingFee ?? room.parkingFee ?? apartment.parkingFee ?? 0;
        const commonAreaCharge = tenant.commonAreaCharge ?? room.commonAreaCharge ?? apartment.commonAreaCharge ?? 0;
        return {
          id: tenant.id,
          apartmentName: apartment.name,
          roomName: room.name,
          tenantName: tenant.name,
          rent,
          waterCharge,
          parkingFee,
          commonAreaCharge,
          sum: rent + waterCharge + parkingFee + commonAreaCharge,
        };
      }),
    [tenants],
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <Container>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>アパート</TableCell>
              <TableCell>部屋</TableCell>
              <TableCell>契約者</TableCell>
              <TableCell>家賃</TableCell>
              <TableCell>水道料金</TableCell>
              <TableCell>駐車場料金</TableCell>
              <TableCell>共益費</TableCell>
              <TableCell>合計</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell padding="checkbox">
                  <Checkbox checked={false} />
                </TableCell>
                <TableCell>{invoice.apartmentName}</TableCell>
                <TableCell>{invoice.roomName}</TableCell>
                <TableCell>{invoice.tenantName}</TableCell>
                <TableCell>{invoice.rent} 円</TableCell>
                <TableCell>{invoice.waterCharge} 円</TableCell>
                <TableCell>{invoice.parkingFee} 円</TableCell>
                <TableCell>{invoice.commonAreaCharge} 円</TableCell>
                <TableCell>{invoice.sum} 円</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box position="fixed" bottom="16px" right="16px" className={styles.unPrint}>
        <Button variant="contained" endIcon={<PrintIcon />} onClick={handlePrint}>
          印刷
        </Button>
      </Box>
    </Container>
  );
};

export default configurePage({
  query: z.object({
    month: z.string(),
  }),
  layout: ({ children, query }) => {
    return <Layout title="プレビュー" prev={`/invoice/list/${query?.month}`}>
      {children}
    </Layout>
  },
  page: ({ query }) => {
    const params = useMemo(() => {
      const date = dayjs(query.month);
      return { year: date.year(), month: date.month() + 1 };
    }, [query.month]);
    const { data: tenants, isFetching } = nextClient.tenant.listOccupying.useQuery(params);

    return tenants && !isFetching ? <InvoiceComponent tenants={tenants} /> : <Loading />;
  },
});
