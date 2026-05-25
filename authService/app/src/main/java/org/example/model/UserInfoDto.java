package org.example.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.*;
import org.example.entities.UserInfo;

@Getter
@Setter
@JsonNaming(PropertyNamingStrategy.class)
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserInfoDto extends UserInfo
{
    @NonNull
    private String firstname;
    @NonNull
    private String lastName;

    private Long phoneNo;
    private String email;
}
