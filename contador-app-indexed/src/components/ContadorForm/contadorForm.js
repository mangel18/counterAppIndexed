import React, { useState, useEffect } from "react";
import {
  Form,
  Select,
  Button,
  Table,
  DatePicker,
  Empty,
  Space,
  Typography,
  Card,
  Badge,
  Popconfirm,
  notification,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import styles from "./contadorForm.module.css";
import moment from "moment";
import {
  addRecord,
  getRecords,
  updateRecord,
  deleteRecord,
} from "../../config/indexedDB";

const { Option } = Select;
const { Text } = Typography;

const ContadorForm = () => {
  const [aguaRecords, setAguaRecords] = useState([]);
  const [banoRecords, setBanoRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [diferenciaAgua, setDiferenciaAgua] = useState(null);
  const [diferenciaBano, setDiferenciaBano] = useState(null);
  const fechaActual = moment().format("DD-MM-YYYY");

  const esFechaActual = selectedDate
    ? moment(selectedDate).format("DD-MM-YYYY") === fechaActual
    : false;

  const notify = (type, message, description) => {
    notification[type]({
      message,
      description,
      placement: "top",
    });
  };

  const saveRecordToIndexedDB = async (values) => {
    const record = {
      tipo: values.tipo,
      fecha: moment().format("DD-MM-YYYY hh:mm:ss A"),
    };
    try {
      await addRecord(record);
      fetchRecords();
      notify(
        "success",
        "Registro Guardado",
        "El registro se guardó correctamente."
      );
    } catch (e) {
      console.error("Error al guardar registro: ", e);
      notify("error", "Error", "Hubo un error al guardar el registro.");
    }
  };

  const fetchRecords = async () => {
    const recordsArray = await getRecords();
    const formattedDate = selectedDate
      ? moment(selectedDate).format("DD-MM-YYYY")
      : null;

    const filterAndSortRecords = (tipo) => {
      return recordsArray
        .filter(
          (record) =>
            record.tipo.toLowerCase() === tipo &&
            (!formattedDate ||
              moment(record.fecha, "DD-MM-YYYY hh:mm:ss A").format(
                "DD-MM-YYYY"
              ) === formattedDate)
        )
        .sort(
          (a, b) =>
            moment(b.fecha, "DD-MM-YYYY hh:mm:ss A") -
            moment(a.fecha, "DD-MM-YYYY hh:mm:ss A")
        );
    };

    const agua = filterAndSortRecords("agua");
    const bano = filterAndSortRecords("baño");

    setAguaRecords(agua);
    setBanoRecords(bano);
    calculateTimeDifference(agua, bano);
  };

  const deleteRecordById = async (id) => {
    try {
      await deleteRecord(id);
      fetchRecords();
      notify(
        "success",
        "Registro Eliminado",
        "El registro se eliminó correctamente."
      );
    } catch (e) {
      console.error("Error al eliminar registro: ", e);
      notify("error", "Error", "Hubo un error al eliminar el registro.");
    }
  };

  const onFinish = (values) => {
    saveRecordToIndexedDB(values);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date ? date.toDate() : null);
  };

  const calculateTimeDifference = (agua, bano) => {
    const calculateDifference = (records, setDifference) => {
      if (records.length >= 2) {
        const [fecha1, fecha2] = [
          moment(records[0].fecha, "DD-MM-YYYY hh:mm:ss A"),
          moment(records[1].fecha, "DD-MM-YYYY hh:mm:ss A"),
        ];
        if (!fecha1.isSame(fecha2)) {
          const diferencia = fecha1.diff(fecha2, "minutes");
          setDifference(diferencia);
          updateRecord(records[0].id, diferencia);
        } else {
          console.warn(
            `Dos registros tienen la misma fecha y hora:`,
            records[0],
            records[1]
          );
        }
      } else {
        setDifference(null);
      }
    };

    calculateDifference(agua, setDiferenciaAgua);
    calculateDifference(bano, setDiferenciaBano);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    calculateTimeDifference(aguaRecords, banoRecords);
  }, [aguaRecords, banoRecords]);

  const columns = [
    {
      title: (
        <span style={{ fontSize: "16px", fontWeight: "bold" }}>Fecha</span>
      ),
      dataIndex: "fecha",
      render: (text) =>
        moment(text, "DD-MM-YYYY hh:mm:ss A").format("DD-MMM-YY hh:mm a"),
      align: "center",
    },
    {
      title: "",
      key: "acciones",
      render: (_, record) => (
        <Popconfirm
          title="¿Estás seguro de eliminar este registro?"
          onConfirm={() => deleteRecordById(record.id)}
          cancelText="Cancelar"
          okText="Aceptar"
        >
          <DeleteOutlined
            style={{ color: "red", fontSize: "18px", cursor: "pointer" }}
          />
        </Popconfirm>
      ),
      align: "center",
    },
  ];

  return (
    <div className={styles.flex}>
      <Card className={styles.card}>
        <div style={{ padding: "20px" }}>
          <h2>Contador Diario</h2>
          <Form onFinish={onFinish} layout="vertical">
            <Form.Item
              name="tipo"
              label="Tipo"
              rules={[{ required: true, message: "Selecciona un tipo" }]}
            >
              <Select placeholder="Selecciona el tipo de registro que quieres guardar">
                <Option value="Baño">Ir al baño</Option>
                <Option value="Agua">Llenar termo de agua</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className={styles.button}
              >
                Guardar Registro
              </Button>
            </Form.Item>
          </Form>

          <h3>Filtrar por Fecha</h3>
          <Space className={styles.space}>
            <DatePicker
              onChange={handleDateChange}
              format="DD-MM-YYYY"
              defaultValue={moment()}
            />
            <Button
              className={styles.button}
              type="primary"
              onClick={fetchRecords}
              disabled={!selectedDate}
            >
              Filtrar
            </Button>
          </Space>

          {["Agua", "Baño"].map((tipo, index) => {
            const records = tipo === "Agua" ? aguaRecords : banoRecords;
            const diferencia =
              tipo === "Agua" ? diferenciaAgua : diferenciaBano;

            return (
              <Card key={index} style={{ margin: "20px 0" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ margin: 0 }}>Registros de {tipo}</h3>
                  <Badge
                    count={records.length}
                    style={{ marginLeft: "10px" }}
                  />
                </div>
                <br />
                {records.length === 0 ? (
                  <Empty
                    description={`Sin registros de ${tipo.toLowerCase()} en esa fecha`}
                  />
                ) : (
                  <Table
                    bordered
                    dataSource={records}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                )}
                {esFechaActual && diferencia !== null && (
                  <Text type="secondary">
                    Diferencia entre últimos dos registros de{" "}
                    {tipo.toLowerCase()}: {diferencia} minutos
                  </Text>
                )}
              </Card>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default ContadorForm;
