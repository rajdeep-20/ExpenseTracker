package com.raj.expenseService.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonIgnoreProperties(ignoreUnknown = true)
@Builder

public class ExpenseDto {

    private String ExternalId;

    @JsonProperty(value = "amount")
    @NonNull
    private BigDecimal amount;

    @JsonProperty(value = "user_id")
    private String userId;

    @JsonProperty(value = "merchant")
    private String merchant;

    @JsonProperty(value = "currency")
    private String currency;

    @JsonProperty(value = "created_at")
    private Timestamp createdAt;


    public ExpenseDto(String json)
    {

        try{

        ObjectMapper ob = JsonMapper.builder()
                .propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
                .build();
        ExpenseDto ex = ob.readValue(json, ExpenseDto.class);

        this.ExternalId = ex.ExternalId;
        this.amount = ex.amount;
        this.userId = ex.userId;
        this.merchant = ex.merchant;
        this.currency = ex.currency;
        this.createdAt = ex.createdAt;
        }

        catch(Exception e)
        {
            throw new RuntimeException("Failed to deserialize JSON to ExpenseDto", e);
        }




    }

}
