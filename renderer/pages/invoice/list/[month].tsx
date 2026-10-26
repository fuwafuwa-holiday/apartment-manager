import {
  Button,
  Checkbox,
  IconButton,
  Input,
  InputAdornment,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Layout from '@/components/Layout';
import { Apartment } from '@mui/icons-material';
import {
  ChangeEventHandler,
  FormEventHandler,
  MouseEvent,
  MouseEventHandler,
  useMemo,
  useState,
} from 'react';
import { Box } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { mapValues } from 'lodash';
import { client, nextClient } from '@/trpc';
import Container from '@/components/Container';
import { configurePage } from '@/components/page/Page';
import Loading from '@/components/page/Loading';
import { Tenant as PTenant, Invoice as PInvoice, Room as PRoom, Apartment as PApartment } from '@/types';
import Controls from '@/components/Controls';
import dayjs from 'dayjs';
import SaveIcon from '@mui/icons-material/Save';
import { formToNum } from '@/util';
import { useRouter } from 'next/router';
import CalculateIcon from '@mui/icons-material/Calculate';

type Apartment = PApartment;

type Room = PRoom & {
  apartment: Apartment;
};

type Tenant = Omit<PTenant, 'roomId' | 'room'> & {
  room: Room;
  invoices: PInvoice[];
};

type ExternalInvoice = Omit<PInvoice, 'id' | 'month'> & {
  id: PInvoice['id'] | null;
};

type Invoice = Omit<PInvoice, 'id' | 'month' | 'rent' | 'waterCharge'> & {
  id: PInvoice['id'] | null;
  rent: string;
  waterCharge: string;
};

type Props = {
  tenants: Tenant[];
  defaultChecks: Record<string, boolean>;
  month: string;
  onChangeMonth: (month: string) => void;
  onSave(invoices: ExternalInvoice[]): Promise<any>;
  onPrint(invoices: ExternalInvoice[], tenantIds: string[]): Promise<any>;
  onPrintList(invoices: ExternalInvoice[]): Promise<any>;
};

const InvoiceComponent = ({ tenants, defaultChecks, month, onChangeMonth, onSave, onPrint, onPrintList }: Props) => {
  const [checks, setChecks] = useState(defaultChecks);
  const getCheck = (id: string) => Boolean(checks[id]);

  const defaultInvoice = useMemo<Invoice[]>(
    () =>
      tenants.map((tenant) => {
        const invoice = tenant.invoices[0] ?? undefined;
        const room = tenant.room;
        const apartment = tenant.room.apartment;
        return {
          id: invoice?.id ?? null,
          tenantId: tenant.id,
          rent: String(invoice?.rent ?? tenant.rent ?? room.rent ?? apartment.rent ?? '0'),
          waterCharge: String(
            invoice?.waterCharge ?? tenant.waterCharge ?? room.waterCharge ?? apartment.waterCharge ?? '0',
          ),
        };
      }),
    [tenants, month],
  );
  const [invoices, setInvoices] = useState<Invoice[]>(defaultInvoice);

  const setInvoiceValue = <K extends keyof Invoice>(index: number, key: K, fn: (value: Invoice[K]) => Invoice[K]) =>
    setInvoices((invoices) => {
      const newInvoices = [...invoices];
      newInvoices[index] = { ...newInvoices[index], [key]: fn(newInvoices[index][key]) };
      return newInvoices;
    });

  const handleChangeRent =
    (index: number): ChangeEventHandler<HTMLInputElement> =>
    (e) =>
      setInvoiceValue(index, 'rent', () => e.target.value);
  const handleBlurRent = (index: number) => () =>
    setInvoiceValue(index, 'rent', (v) => (v.trim() === '' ? defaultInvoice[index].rent : v));
  const handleChangeWaterCharge =
    (index: number): ChangeEventHandler<HTMLInputElement> =>
    (e) =>
      setInvoiceValue(index, 'waterCharge', () => e.target.value);
  const handleBlurWaterCharge = (index: number) => () =>
    setInvoiceValue(index, 'waterCharge', (v) => (v.trim() === '' ? defaultInvoice[index].waterCharge : v));

  const setCheck = (id: string) => {
    setChecks((checks) => ({ ...checks, [id]: Boolean(!checks[id]) }));
  };

  const checkValues = Object.values(checks);
  const allCheck = checkValues.every((b) => b);
  const lt1Check = checkValues.some((b) => b);
  const notCheck = checkValues.every((b) => !b);
  const someCheck = !allCheck && lt1Check;

  const handleChange = () => {
    if (allCheck || lt1Check) {
      setChecks((checks) => mapValues(checks, () => false));
    } else {
      setChecks((checks) => mapValues(checks, () => true));
    }
  };

  const handleChangeMonth: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChangeMonth(e.target.value);
  };

  const handleChangePrevMonth = () => {
    onChangeMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'));
  };

  const handleChangeNextMonth = () => {
    onChangeMonth(dayjs(month).add(1, 'month').format('YYYY-MM'));
  };

  const getExportInvoice = () =>
    invoices.map(
      (invoice): ExternalInvoice => ({
        ...invoice,
        rent: formToNum(invoice.rent) ?? 0,
        waterCharge: formToNum(invoice.waterCharge) ?? 0,
      }),
    );

  const handleSave = async (e: MouseEvent<HTMLButtonElement>) => {
    const currentTarget = e.currentTarget;
    await onSave(getExportInvoice());
    setSavePopoverTarget(currentTarget);
  };
  const handlePrint = () =>
    onPrint(
      getExportInvoice(),
      Object.entries(checks)
        .filter(([, value]) => value)
        .map(([key]) => key),
    );
  const handlePrintList = () => onPrintList(getExportInvoice());

  const [savePopoverTarget, setSavePopoverTarget] = useState<HTMLButtonElement | null>(null);
  const handleCloseSavePopover = () => setSavePopoverTarget(null);
  const openSavePopover = Boolean(savePopoverTarget);

  const [waterChargePopoverTarget, setWaterChargePopoverTarget] = useState<{
    elem: HTMLButtonElement;
    index: number;
  } | null>(null);
  const handleCloseWaterChargePopover = () => {
    setWaterChargePopoverTarget(null);
  };
  const openWaterChargePopover = Boolean(waterChargePopoverTarget);

  const handleClickWaterCharge =
    (index: number): MouseEventHandler<HTMLButtonElement> =>
    (e) => {
      setWaterChargePopoverTarget({ elem: e.currentTarget, index });
      setWaterUsage('');
    };

  const [waterUsage, setWaterUsage] = useState('');
  const handleUpdateWaterUsage: ChangeEventHandler<HTMLInputElement> = (e) => setWaterUsage(e.target.value);
  const handleCalcWaterCharge: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const waterUsageNum = formToNum(waterUsage);
    if (waterChargePopoverTarget && waterUsageNum !== null) {
      const index = waterChargePopoverTarget.index;
      const { waterCharge } = tenants[index];
      setInvoiceValue(waterChargePopoverTarget.index, 'waterCharge', () => String(waterUsageNum * (waterCharge ?? 350)));
    }
    setWaterChargePopoverTarget(null);
  };

  return (
    <Container>
      <Controls>
        <Button onClick={handleChangePrevMonth}>先月</Button>
        <TextField type="month" value={month} onChange={handleChangeMonth} />
        <Button onClick={handleChangeNextMonth}>来月</Button>
      </Controls>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox checked={allCheck} indeterminate={someCheck} onChange={handleChange} />
              </TableCell>
              <TableCell>アパート</TableCell>
              <TableCell>部屋</TableCell>
              <TableCell>契約者</TableCell>
              <TableCell>家賃</TableCell>
              <TableCell>水道料金</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((tenant, index) => (
              <TableRow key={tenant.id}>
                <TableCell padding="checkbox">
                  <Checkbox checked={getCheck(tenant.id)} onChange={() => setCheck(tenant.id)} />
                </TableCell>
                <TableCell>{tenant.room.apartment.name}</TableCell>
                <TableCell>{tenant.room.name}</TableCell>
                <TableCell>{tenant.name}</TableCell>
                <TableCell padding="none">
                  <Input
                    type="number"
                    style={{ width: '80px' }}
                    value={invoices[index].rent}
                    onChange={handleChangeRent(index)}
                    onBlur={handleBlurRent(index)}
                  />
                  円
                </TableCell>
                <TableCell padding="none">
                  <TextField
                    type="number"
                    variant="standard"
                    style={{ width: '120px' }}
                    value={invoices[index].waterCharge}
                    onChange={handleChangeWaterCharge(index)}
                    onBlur={handleBlurWaterCharge(index)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleClickWaterCharge(index)}>
                            <CalculateIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  円
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Popover
        open={openWaterChargePopover}
        anchorEl={waterChargePopoverTarget?.elem}
        onClose={handleCloseWaterChargePopover}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box p="16px">
          <form onSubmit={handleCalcWaterCharge}>
            <TextField label="使用量(㎥)" variant="outlined" value={waterUsage} onChange={handleUpdateWaterUsage} />
            <Button type="submit" variant="contained">
              入力
            </Button>
          </form>
        </Box>
      </Popover>

      <Box position="fixed" bottom="16px" right="16px">
        <Popover
          open={openSavePopover}
          anchorEl={savePopoverTarget}
          onClose={handleCloseSavePopover}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
        >
          <Typography sx={{ p: 2 }}>保存しました</Typography>
        </Popover>
        <Button variant="contained" endIcon={<SaveIcon />} onClick={handleSave}>
          保存
        </Button>
        <Button variant="contained" endIcon={<PrintIcon />} onClick={handlePrint} disabled={notCheck}>
          印刷
        </Button>
        <Button variant="contained" endIcon={<PrintIcon />} onClick={handlePrintList} disabled={notCheck}>
          表の印刷
        </Button>
      </Box>
    </Container>
  );
};

export default configurePage({
  layout: ({ children }) => (
    <Layout title="レシート発行" prev="/">
      {children}
    </Layout>
  ),
  page: () => {
    const router = useRouter();
    const util = nextClient.useContext();
    const month = useMemo(() => dayjs(router.query?.month as string).format('YYYY-MM'), [router.query?.month]);

    const query = useMemo(() => {
      const date = dayjs(month);
      return { year: date.year(), month: date.month() + 1 };
    }, [month]);
    const { data: tenants, isFetching } = nextClient.tenant.listOccupying.useQuery(query);

    const defaultChecks = tenants ? Object.fromEntries(tenants.map((tenant) => [tenant.id, true])) : undefined;

    const handleSave = async (invoices: PInvoice[]) => {
      await client.invoice.update.mutate({ month, invoices });
      util.invalidate();
    };
    const handlePrint = async (invoices: PInvoice[], tenantIds: string[]) => {
      const params = new URLSearchParams({ tenantIds: tenantIds.join(',') });
      await client.invoice.update.mutate({ month, invoices });
      util.invalidate();
      router.push(`/invoice/preview/${month}?${params.toString()}`);
    };
    const handlePrintList = async (invoices: PInvoice[]) => {
      await client.invoice.update.mutate({ month, invoices });
      util.invalidate();
      router.push(`/invoice/list-preview/${month}`);
    };

    const handleChangeMonth = (month: string) => {
      router.push(`/invoice/list/${month}`);
    };

    return tenants && defaultChecks && !isFetching ? (
      <InvoiceComponent
        tenants={tenants}
        defaultChecks={defaultChecks}
        month={month}
        onChangeMonth={handleChangeMonth}
        key={month}
        onSave={handleSave}
        onPrint={handlePrint}
        onPrintList={handlePrintList}
      />
    ) : (
      <Loading />
    );
  },
});
