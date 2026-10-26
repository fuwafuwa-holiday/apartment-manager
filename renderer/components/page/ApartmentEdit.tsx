import { useCallback, useEffect, useMemo, useState } from 'react';
import { arrayMoveImmutable } from 'array-move';
import { SortableContainer, SortableElement, SortEndHandler } from 'react-sortable-hoc';
import { uniqueId } from 'lodash';
import { Box, Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import TextField from '@/components/form/TextField';
import FormGroup from '@/components/FromGroup';
import FloatingControls from '@/components/FloatingControls';
import { Apartment as PApartment, Room as PRoom } from '@/types';
import Container from '@/components/Container';
import { useObjectState, useSubmit } from '@/hooks';
import Section from '../Section';
import Controls from '../Controls';
import NumberTextField from '../form/NumberTextField';
import { formToNum, numToForm } from '@/util';

type Room = Omit<PRoom, 'id' | 'apartmentId' | 'rent' | 'waterCharge' | 'parkingFee' | 'commonAreaCharge' | 'index'> & {
  id: PRoom['id'] | null;
  key: string;
  rent: string;
  waterCharge: string;
  parkingFee: string;
  commonAreaCharge: string;
};

type Apartment = Omit<PApartment, 'id' | 'rooms' | 'rent' | 'waterCharge' | 'parkingFee' | 'commonAreaCharge'> & {
  id: PApartment['id'] | null;
  rent: string;
  waterCharge: string;
  parkingFee: string;
  commonAreaCharge: string;
};

export type ExternalRoom = Omit<PRoom, 'id' | 'apartmentId'> & {
  id: PApartment['id'] | null;
};

export type ExternalApartment = Omit<PApartment, 'id' | 'rooms'> & {
  id: PApartment['id'] | null;
  rooms: ExternalRoom[];
};

type Props = {
  apartment?: ExternalApartment;
  onSave: (apartment: ExternalApartment) => void;
};

type UpdateRoomHandler = (key: string, fn: (room: Room) => Room) => void;
type DeleteRoomHandler = (key: string) => void;

type RoomsContainerProps = {
  rooms: Room[];
  onUpdateRoom: UpdateRoomHandler;
  onDeleteRoom: DeleteRoomHandler;
};

type RoomElementProps = {
  room: Room;
  onUpdateRoom: UpdateRoomHandler;
  onDeleteRoom: DeleteRoomHandler;
};

const ApartmentEdit = ({ apartment: originalApartment, onSave }: Props) => {
  const defaultApartment: Apartment = useMemo(
    () =>
      originalApartment
        ? {
            ...originalApartment,
            rent: numToForm(originalApartment.rent),
            waterCharge: numToForm(originalApartment.waterCharge),
            parkingFee: numToForm(originalApartment.parkingFee),
            commonAreaCharge: numToForm(originalApartment.commonAreaCharge),
          }
        : {
            id: null,
            name: '',
            rent: '',
            waterCharge: '',
            parkingFee: '',
            commonAreaCharge: '',
            admin: '',
          },
    [originalApartment],
  );

  const defaultRooms = useMemo(
    () =>
      originalApartment
        ? originalApartment.rooms.map((room) => ({
            ...room,
            key: uniqueId('room-d'),
            rent: numToForm(room.rent),
            waterCharge: numToForm(room.waterCharge),
            parkingFee: numToForm(room.parkingFee),
            commonAreaCharge: numToForm(room.commonAreaCharge),
          }))
        : [],
    [originalApartment],
  );

  const [apartment, setApartment] = useState<Apartment>(defaultApartment);
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);

  const handleChangeName = useObjectState(setApartment, 'name');
  const handleChangeRent = useObjectState(setApartment, 'rent');
  const handleChangeWaterCharge = useObjectState(setApartment, 'waterCharge');
  const handleChangeParkingFee = useObjectState(setApartment, 'parkingFee');
  const handleChangeCommonAreaCharge = useObjectState(setApartment, 'commonAreaCharge');
  const handleChangeAdmin = useObjectState(setApartment, 'admin');

  const handleSort: SortEndHandler = useCallback(
    ({ oldIndex, newIndex }) => setRooms((r) => arrayMoveImmutable(r, oldIndex, newIndex)),
    [setApartment],
  );

  const handleUpdateRoom: UpdateRoomHandler = useCallback(
    (key, fn: (room: Room) => Room) => {
      setRooms((rooms) => {
        const index = rooms.findIndex((room) => room.key === key);
        if (index === -1) return rooms;
        const newRooms = [...rooms];
        newRooms[index] = fn(newRooms[index]);
        return newRooms;
      });
    },
    [setRooms],
  );

  const handleSubmit = useSubmit(
    () =>
      onSave({
        ...apartment,
        rooms: rooms.map((room, index) => ({
          ...room,
          index,
          rent: formToNum(room.rent),
          waterCharge: formToNum(room.waterCharge),
          parkingFee: formToNum(room.parkingFee),
          commonAreaCharge: formToNum(room.commonAreaCharge),
          admin: room.admin,
        })),
        rent: formToNum(apartment.rent),
        waterCharge: formToNum(apartment.waterCharge),
        parkingFee: formToNum(apartment.parkingFee),
        commonAreaCharge: formToNum(apartment.commonAreaCharge),
        admin: apartment.admin,
      }),
    [rooms, apartment, onSave],
  );

  const handleAddRoom = useCallback(() => {
    setRooms((r): Room[] => [
      ...r,
      {
        key: uniqueId('room'),
        id: null,
        name: '',
        rent: '',
        waterCharge: '',
        parkingFee: '',
        commonAreaCharge: '',
        admin: '',
      },
    ]);
  }, [setApartment]);

  const handleRemoveRoom: DeleteRoomHandler = useCallback(
    (key) => {
      setRooms((r) => {
        const index = r.findIndex((room) => room.key === key);
        if (index === -1) return r;
        const rooms = [...r];
        rooms.splice(index, 1);
        return rooms;
      });
    },
    [setApartment],
  );

  return (
    <Container mb="68px">
      <form onSubmit={handleSubmit}>
        <FormGroup label="名前">
          <TextField value={apartment.name} onChange={handleChangeName} />
        </FormGroup>
        <FormGroup label="家賃(円)">
          <NumberTextField value={apartment.rent} onChange={handleChangeRent} />
        </FormGroup>
        <FormGroup label="水道料金(円)">
          <NumberTextField value={apartment.waterCharge} onChange={handleChangeWaterCharge} />
        </FormGroup>
        <FormGroup label="駐車場料金(円)">
          <NumberTextField value={apartment.parkingFee} onChange={handleChangeParkingFee} />
        </FormGroup>
        <FormGroup label="共益費(円)">
          <NumberTextField value={apartment.commonAreaCharge} onChange={handleChangeCommonAreaCharge} />
        </FormGroup>
        <FormGroup label="管理者">
          <NumberTextField value={apartment.admin} onChange={handleChangeAdmin} />
        </FormGroup>
        <Section title="部屋">
          <RoomsContainer
            rooms={rooms}
            onSortEnd={handleSort}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleRemoveRoom}
          />
          <Controls>
            <Button variant="contained" onClick={handleAddRoom}>
              部屋追加
            </Button>
          </Controls>
        </Section>
        <FloatingControls>
          <Button variant="contained" type="submit" endIcon={<SaveIcon />}>
            保存
          </Button>
        </FloatingControls>
      </form>
    </Container>
  );
};

const RoomsContainer = SortableContainer<RoomsContainerProps>(
  ({ rooms, onUpdateRoom, onDeleteRoom }: RoomsContainerProps) => {
    return (
      <Box bgcolor="#eee">
        {rooms.map((room, index) => (
          <RoomElement
            key={room.key}
            room={room}
            index={index}
            onUpdateRoom={onUpdateRoom}
            onDeleteRoom={onDeleteRoom}
          />
        ))}
      </Box>
    );
  },
);

const RoomElement = SortableElement<RoomElementProps>(({ room, onUpdateRoom, onDeleteRoom }: RoomElementProps) => {
  const setRoom = useCallback((fn: (room: Room) => Room) => onUpdateRoom(room.key, fn), [onUpdateRoom, room.key]);

  const [isOpen, setOpen] = useState(false);

  const handleDeleteRoom = useCallback(() => {
    onDeleteRoom(room.key);
  }, [onDeleteRoom, room.key]);

  const handleChangeName = useObjectState(setRoom, 'name');
  const handleChangeRent = useObjectState(setRoom, 'rent');
  const handleChangeWaterCharge = useObjectState(setRoom, 'waterCharge');
  const handleChangeParkingFee = useObjectState(setRoom, 'parkingFee');
  const handleChangeCommonAreaCharge = useObjectState(setRoom, 'commonAreaCharge');
  const handleChangeAdmin = useObjectState(setRoom, 'admin');

  return (
    <Box border="1px solid #ddd" bgcolor="#fff" position="relative" padding="16px">
      <Box position="absolute" top="0" right="0">
        <Button variant="contained" onClick={handleDeleteRoom}>
          削除
        </Button>
      </Box>
      <FormGroup label="部屋名">
        <TextField value={room.name} onChange={handleChangeName} />
      </FormGroup>
      <FormGroup label="家賃(円)">
        <NumberTextField value={room.rent} onChange={handleChangeRent} />
      </FormGroup>
      <Button onClick={() => setOpen((b) => !b)}>詳細</Button>
      {isOpen && (
        <Box>
          <FormGroup label="水道料金(円)">
            <NumberTextField value={room.waterCharge} onChange={handleChangeWaterCharge} />
          </FormGroup>
          <FormGroup label="駐車場料金(円)">
            <NumberTextField value={room.parkingFee} onChange={handleChangeParkingFee} />
          </FormGroup>
          <FormGroup label="共益費(円)">
            <NumberTextField value={room.commonAreaCharge} onChange={handleChangeCommonAreaCharge} />
          </FormGroup>
          <FormGroup label="管理者">
            <NumberTextField value={room.admin} onChange={handleChangeAdmin} />
          </FormGroup>
        </Box>
      )}
    </Box>
  );
});

export default ApartmentEdit;
