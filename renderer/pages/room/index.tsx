import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import type { Apartment as PApartment, Room as PRoom } from '@/types';
import Layout from '@/components/Layout';
import ButtonLink from '@/components/ButtonLink';
import { nextClient } from '@/trpc';
import Container from '@/components/Container';
import Section from '@/components/Section';
import { configurePage } from '@/components/page/Page';
import Loading from '@/components/page/Loading';

type Room = PRoom & {
  occupancyStatus: string;
};

type Apartment = PApartment & {
  rooms: Room[];
};

type Props = {
  apartments: Apartment[];
};

const RoomComponent = ({ apartments }: Props) => {
  return (
    <Container>
      {apartments.map((apartment) => (
        <Section title={apartment.name} key={apartment.id}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>部屋名</TableCell>
                  <TableCell>入居状況</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apartment.rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>{room.name}</TableCell>
                    <TableCell>{room.occupancyStatus === 'empty' ? '---' : '入居中'}</TableCell>
                    <TableCell align="right">
                      <ButtonLink href={`/room/detail/${room.id}`}>編集</ButtonLink>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Section>
      ))}
    </Container>
  );
};

export default configurePage({
  layout: ({ children }) => (
    <Layout title="入居状況変更" prev="/">
      {children}
    </Layout>
  ),
  page: () => {
    const { data: apartments, isFetching } = nextClient.room.list.useQuery();
    return apartments && !isFetching ? <RoomComponent apartments={apartments} /> : <Loading />;
  },
});
