import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import Layout from '@/components/Layout';
import z from 'zod';
import type { Apartment, Tenant as PTenant, Room as PRoom } from '@/types';
import { Box } from '@mui/material';
import ButtonLink from '@/components/ButtonLink';
import { client, nextClient } from '@/trpc';
import TextField from '@/components/form/TextField';
import FormGroup from '@/components/FromGroup';
import dayjs from 'dayjs';
import Container from '@/components/Container';
import Section from '@/components/Section';
import Loading from '@/components/page/Loading';
import { configurePage } from '@/components/page/Page';
import { usePrompt } from '@/components/Prompt';
import styles from '@/styles/Table.module.scss';

type Tenant = PTenant & {
  isResidence: boolean;
};

type Room = PRoom & {
  occupancyStatus: string;
};

type Props = {
  apartment: Apartment;
  room: Room;
  tenants: Tenant[];
};

const date = (date: string | Date | null) => {
  if (date === null) return '---';
  return dayjs(date).format('YYYY/MM/DD');
};

function Detail({ apartment, room, tenants }: Props) {
  const util = nextClient.useContext();

  const [prompt, promptComponent] = usePrompt();

  const handleDelete = async (tenant: Tenant) => {
    if (await prompt({ text: `部屋「${tenant.name}」を削除しますか？` })) {
      await client.tenant.delete.mutate({ tenantId: tenant.id });
      util.invalidate();
    }
  };

  return (
    <Container>
      <Box my="32px">
        <Typography variant="h6">
          {apartment.name} / {room.name}
        </Typography>
      </Box>
      <FormGroup label="入居状況">
        <TextField value={room.occupancyStatus === 'empty' ? '空室' : '入居中'} disabled />
      </FormGroup>
      <Section title="入居者">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>氏名</TableCell>
                <TableCell>入居日</TableCell>
                <TableCell>退去日</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id} className={tenant.isResidence ? styles.activeRow : undefined}>
                  <TableCell>{tenant.name}</TableCell>
                  <TableCell>{date(tenant.since)}</TableCell>
                  <TableCell>{date(tenant.until)}</TableCell>
                  <TableCell align="right">
                    <Button variant="contained" color="warning" onClick={() => handleDelete(tenant)}>
                      削除
                    </Button>
                    <ButtonLink href={`/room/detail/${room.id}/edit/${tenant.id}`}>編集</ButtonLink>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Section>
      <ButtonLink href={`/room/detail/${room.id}/new`}>入居者追加</ButtonLink>
      {promptComponent}
    </Container>
  );
}
export default configurePage({
  query: z.object({
    roomId: z.string(),
  }),
  layout: ({ children }) => (
    <Layout title="部屋の入居状況" prev="/room">
      {children}
    </Layout>
  ),
  page: ({ query }) => {
    const { data: room, isFetching } = nextClient.room.get.useQuery(query);
    return room && !isFetching ? <Detail room={room} apartment={room.apartment} tenants={room.tenants} /> : <Loading />;
  },
});
