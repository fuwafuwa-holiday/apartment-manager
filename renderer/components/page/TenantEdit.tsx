import { Button, Typography } from '@mui/material';
import { Box } from '@mui/material';
import { useMemo, useState } from 'react';
import FloatingControls from '@/components/FloatingControls';
import DatePicker from '@/components/form/DatePicker';
import TextField from '@/components/form/TextField';
import FormGroup from '@/components/FromGroup';
import SaveIcon from '@mui/icons-material/Save';
import Container from '@/components/Container';
import { useObjectState, useSubmit } from '@/hooks';
import NumberTextField from '../form/NumberTextField';
import { Apartment, Room, Tenant as PTenant } from '@/types';
import { dateToForm, formToDate, formToNum, numToForm } from '@/util';
import dayjs from 'dayjs';

export type ExternalTenant = Omit<PTenant, 'id' | 'apartmentId' | 'roomId'> & {
  id: PTenant['id'] | null;
};

type Tenant = Omit<
  PTenant,
  'id' | 'apartmentId' | 'roomId' | 'since' | 'until' | 'rent' | 'waterCharge' | 'parkingFee' | 'commonAreaCharge'
> & {
  id: PTenant['id'] | null;
  since: string | null;
  until: string | null;
  rent: string;
  waterCharge: string;
  parkingFee: string;
  commonAreaCharge: string;
};

type Props = {
  apartment: Apartment;
  room: Room;
  tenant?: ExternalTenant;
  onSave: (tenant: ExternalTenant) => void;
};

const TenantEdit = ({ apartment, room, tenant: originalTenant, onSave }: Props) => {
  const defaultTenant: Tenant = useMemo(() => {
    if (originalTenant) {
      return {
        ...originalTenant,
        since: dateToForm(originalTenant.since),
        until: dateToForm(originalTenant.until),
        rent: numToForm(originalTenant.rent),
        waterCharge: numToForm(originalTenant.waterCharge),
        parkingFee: numToForm(originalTenant.parkingFee),
        commonAreaCharge: numToForm(originalTenant.commonAreaCharge),
      };
    }
    const now = dayjs();
    return {
      id: null,
      name: '',
      since: dateToForm(new Date(now.year(), now.month(), now.date())),
      until: dateToForm(new Date(2100, 0, 1)),
      rent: numToForm(room.rent ?? apartment.rent ?? null),
      waterCharge: numToForm(room.waterCharge ?? apartment.waterCharge ?? null),
      parkingFee: numToForm(room.parkingFee ?? apartment.parkingFee ?? null),
      commonAreaCharge: numToForm(room.commonAreaCharge ?? apartment.commonAreaCharge ?? null),
      admin: room.admin ?? apartment.admin ?? '',
    };
  }, [originalTenant, room, apartment]);

  const [tenant, setTenant] = useState<Tenant>(defaultTenant);

  const handleChangeName = useObjectState(setTenant, 'name');
  const handleChangeSince = useObjectState(setTenant, 'since');
  const handleChangeUntil = useObjectState(setTenant, 'until');
  const handleChangeRent = useObjectState(setTenant, 'rent');
  const handleChangeWaterCharge = useObjectState(setTenant, 'waterCharge');
  const handleChangeParkingFee = useObjectState(setTenant, 'parkingFee');
  const handleChangeCommonAreaCharge = useObjectState(setTenant, 'commonAreaCharge');
  const handleChangeAdmin = useObjectState(setTenant, 'admin');

  const handleSubmit = useSubmit(
    () =>
      onSave({
        ...tenant,
        since: formToDate(tenant.since),
        until: formToDate(tenant.until),
        rent: formToNum(tenant.rent),
        waterCharge: formToNum(tenant.waterCharge),
        parkingFee: formToNum(tenant.parkingFee),
        commonAreaCharge: formToNum(tenant.commonAreaCharge),
      }),
    [tenant],
  );

  return (
    <Container mb="68px">
      <form onSubmit={handleSubmit}>
        <Box my="32px">
          <Typography variant="h6">
            {apartment.name} / {room.name}
          </Typography>
        </Box>
        <FormGroup label="入居者名">
          <TextField value={tenant.name} onChange={handleChangeName} />
        </FormGroup>
        <FormGroup label="入居日">
          <DatePicker value={tenant.since} onChange={handleChangeSince} />
        </FormGroup>
        <FormGroup label="退去日">
          <DatePicker value={tenant.until} onChange={handleChangeUntil} />
        </FormGroup>
        <FormGroup label="家賃(円)">
          <NumberTextField value={tenant.rent} onChange={handleChangeRent} />
        </FormGroup>
        <FormGroup label="水道料金(円)">
          <NumberTextField value={tenant.waterCharge} onChange={handleChangeWaterCharge} />
        </FormGroup>
        <FormGroup label="駐車場料金(円)">
          <NumberTextField value={tenant.parkingFee} onChange={handleChangeParkingFee} />
        </FormGroup>
        <FormGroup label="共益費(円)">
          <NumberTextField value={tenant.commonAreaCharge} onChange={handleChangeCommonAreaCharge} />
        </FormGroup>
        <FormGroup label="管理者">
          <NumberTextField value={tenant.admin} onChange={handleChangeAdmin} />
        </FormGroup>
        <FloatingControls>
          <Button variant="contained" type="submit" endIcon={<SaveIcon />}>
            保存
          </Button>
        </FloatingControls>
      </form>
    </Container>
  );
};

export default TenantEdit;
