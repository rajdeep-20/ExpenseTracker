package com.raj.expenseService.consumer;


import com.raj.expenseService.dto.ExpenseDto;
import org.apache.kafka.common.serialization.Deserializer;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;
public class ExpenseDeserializer implements Deserializer<ExpenseDto>
{
    @Override
    public void close(){}

    @Override
    public void configure(Map<String, ?> configs, boolean isKey){}

    @Override
    public ExpenseDto deserialize(String topic, byte [] data)
    {
        ObjectMapper mapper = new ObjectMapper();
        ExpenseDto expense = null;

        try{
            expense = mapper.readValue(data, ExpenseDto.class);
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
        return expense;
    }
}
